import redis from "../../../shared/redis/redis.js";
import { resumeAgent } from "../agents/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import fs from "fs/promises";

export const uploadResume = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Resume PDF is required" });
    }
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "UserId is required" });
    }
    const resumeText = await extractText(file.path);
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unable to extract text from PDF",
      });
    }

    const aiResponse = await resumeAgent(resumeText);

    const resumeData = JSON.parse(aiResponse);
    console.log("AI RESUME DATA:", JSON.stringify(resumeData, null, 2));
    let resume = await Resume.findOne({ userId });
    if (resume) {
      Object.assign(resume, {
        ...resumeData,
        extractedText: resumeText,
      });
      await resume.save();
    } else {
      resume = await Resume.create({
        userId,
        ...resumeData,
        extractedText: resumeText,
      });
    }
    try {
      // CHANGED: del hata diya, set khud overwrite karta hai
      await redis.set(`resume:${userId}`, JSON.stringify(resume), "EX", 3600);
    } catch (redisError) {
      console.error("REDIS CACHE ERROR:", redisError);
    }
    return res
      .status(200)
      .json({ success: true, message: "Resume analyzed successfully", resume });
  } catch (error) {
    console.error("UPLOAD RESUME ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Resume upload failed" });
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }
  }
};

export const getResume = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required",
      });
    }

    // Always fetch latest resume from MongoDB
    const resume = await Resume.findOne({ userId });

    if (!resume) {
      await redis.del(`resume:${userId}`).catch(console.error);

      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Update Redis with latest MongoDB data
    try {
      await redis.set(
        `resume:${userId}`,
        JSON.stringify(resume),
        "EX",
        3600
      );
    } catch (redisError) {
      console.error("REDIS CACHE UPDATE ERROR:", redisError);
    }

    res.set("Cache-Control", "no-store"); // NEW

    return res.status(200).json({
      success: true,
      source: "mongoDb",
      data: resume,
    });
  } catch (error) {
    console.error("GET RESUME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch resume",
    });
  }
};