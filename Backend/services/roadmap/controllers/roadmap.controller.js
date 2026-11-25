import mongoose from "mongoose";
import Roadmap from "../models/roadmap.model.js";
import redis from "../../../shared/redis/redis.js";

import roadmapGraph from "../graph/roadmap.graph.js";
import { deductCoins, refundCoins } from "../utils/coins.js";

const ROADMAP_COST = Number(process.env.ROADMAP_COIN_COST) || 100;
const MAX_RESUME_CHARS = 20000;

const LEVELS = ["beginner", "intermediate", "advanced"];

const toTitleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// POST /generate
export const generateRoadmap = async (req, res) => {
  const userId = req.userId;
  const referenceId = new mongoose.Types.ObjectId().toString();

  let charged = false;
  let deduction = null;

  // Keep MongoDB balance and Redis session synchronized
  const syncRedisCoins = async (coins) => {
    const sessionId = req.cookies?.session;

    if (!sessionId || !Number.isFinite(Number(coins))) {
      return;
    }

    const sessionKey = `session:${sessionId}`;
    const redisSession = await redis.get(sessionKey);

    if (!redisSession) return;

    const sessionData = JSON.parse(redisSession);

    sessionData.interviewCoin = Number(coins);

    await redis.set(
      sessionKey,
      JSON.stringify(sessionData),
      "EX",
      7 * 24 * 60 * 60
    );
  };

  try {
    const body = req.body || {};

    // Frontend sends goal / targetRole / target_role, so accept all of them
    const role = body.role || body.targetRole || body.target_role || body.goal;
    const targetPackage = body.targetPackage || body.target_package;

    const useResume = body.useResume ?? false;
    const resume = body.resume;

    // New inputs from the form
    const levelInput = String(body.level || "beginner").toLowerCase();
    const weeks = Number(body.weeks ?? 8);
    const hoursPerDay = Number(body.hoursPerDay ?? body.hours_per_day ?? 2);

    if (!role || !targetPackage) {
      return res.status(400).json({
        success: false,
        message: "Role and Target Package are required",
      });
    }

    if (!LEVELS.includes(levelInput)) {
      return res.status(400).json({
        success: false,
        message: "Level must be beginner, intermediate or advanced",
      });
    }

    if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) {
      return res.status(400).json({
        success: false,
        message: "Weeks must be a whole number between 1 and 52",
      });
    }

    if (!Number.isFinite(hoursPerDay) || hoursPerDay < 1 || hoursPerDay > 12) {
      return res.status(400).json({
        success: false,
        message: "Hours per day must be between 1 and 12",
      });
    }

    if (useResume && !resume) {
      return res.status(400).json({
        success: false,
        message: "Resume data is required",
      });
    }

    const resumeData = useResume ? resume : null;

    if (
      resumeData &&
      JSON.stringify(resumeData).length > MAX_RESUME_CHARS
    ) {
      return res.status(400).json({
        success: false,
        message: "Resume data is too large",
      });
    }

    // 1. Deduct coins through Billing Service
    deduction = await deductCoins({
      userId,
      amount: ROADMAP_COST,
      referenceId,
    });

    charged = true;

    // 2. Update Redis with latest coin balance
    await syncRedisCoins(deduction.interviewCoin);

    // 3. Generate roadmap (user inputs are hard constraints now)
    const result = await roadmapGraph.invoke({
      role,
      targetPackage,
      level: levelInput,
      weeks,
      hoursPerDay,
      resume: resumeData,
    });

    const generated = result?.roadmap;

    if (!generated?.modules?.length) {
      throw new Error("AI returned an empty roadmap");
    }

    // 4. Save roadmap
    // duration, level and targetPackage always come from the user's input,
    // not from the LLM, so they can never be wrong.
    const roadmap = await Roadmap.create({
      userId,
      title: generated.title,
      targetPackage,
      duration: `${weeks} ${weeks === 1 ? "week" : "weeks"}`,
      level: toTitleCase(levelInput),
      capstoneProject: generated.capstoneProject,
      modules: generated.modules,
    });

    // 5. Send updated balance to frontend
    return res.status(201).json({
      success: true,
      message: "Roadmap generated successfully",
      data: roadmap,
      interviewCoin: deduction.interviewCoin,
    });

  } catch (error) {
    console.error("generateRoadmap error:", error);

    // 6. Refund coins if generation fails
    if (charged) {
      try {
        const refund = await refundCoins({
          userId,
          amount: ROADMAP_COST,
          referenceId,
        });

        // 7. Sync Redis after refund
        await syncRedisCoins(refund.interviewCoin);

      } catch (refundError) {
        console.error(
          "Roadmap refund/sync failed:",
          refundError.message
        );
      }
    }

    const status = error.status || 500;

    return res.status(status).json({
      success: false,
      message:
        status === 500
          ? "Failed to generate roadmap"
          : error.message,
    });
  }
};

// GET /  -> user ke saare roadmaps (list view, modules ke bina)
export const getMyRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.userId })
      .select("title targetPackage duration level createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: roadmaps });
  } catch (error) {
    console.error("getMyRoadmaps error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch roadmaps" });
  }
};

// GET /:id  -> ek full roadmap
export const getRoadmapById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid roadmap id" });
    }

    const roadmap = await Roadmap.findOne({ _id: id, userId: req.userId }).lean();
    if (!roadmap) {
      return res.status(404).json({ success: false, message: "Roadmap not found" });
    }

    return res.status(200).json({ success: true, data: roadmap });
  } catch (error) {
    console.error("getRoadmapById error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch roadmap" });
  }
};

// DELETE /:id
export const deleteRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid roadmap id" });
    }

    const result = await Roadmap.deleteOne({ _id: id, userId: req.userId });
    if (!result.deletedCount) {
      return res.status(404).json({ success: false, message: "Roadmap not found" });
    }

    return res.status(200).json({ success: true, message: "Roadmap deleted" });
  } catch (error) {
    console.error("deleteRoadmap error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete roadmap" });
  }
};

// PATCH /:id/progress  -> completed modules save karo
export const updateRoadmapProgress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid roadmap id" });
    }

    const { completedModules } = req.body || {};
    if (!Array.isArray(completedModules)) {
      return res.status(400).json({
        success: false,
        message: "completedModules must be an array",
      });
    }

    const roadmap = await Roadmap.findOne({ _id: id, userId: req.userId }).select("modules");
    if (!roadmap) {
      return res.status(404).json({ success: false, message: "Roadmap not found" });
    }

    // sirf valid, unique indexes rakho
    const total = roadmap.modules.length;
    const cleaned = [...new Set(completedModules.map(Number))]
      .filter((n) => Number.isInteger(n) && n >= 0 && n < total)
      .sort((a, b) => a - b);

    await Roadmap.updateOne({ _id: id, userId: req.userId }, { completedModules: cleaned });

    return res.status(200).json({ success: true, data: { completedModules: cleaned } });
  } catch (error) {
    console.error("updateRoadmapProgress error:", error);
    return res.status(500).json({ success: false, message: "Failed to update progress" });
  }
};
