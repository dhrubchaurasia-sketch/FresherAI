import { Router } from "express";
import mongoose from "mongoose";
import {
  generateRoadmap,
  getMyRoadmaps,
  getRoadmapById,
  deleteRoadmap,
  updateRoadmapProgress,   // <-- add
} from "../controllers/roadmap.controller.js";

const router = Router();

// Gateway jo x-user-id bhejta hai usse user nikalta hai
const requireUser = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

router.use(requireUser);

router.post("/generate", generateRoadmap);
router.get("/", getMyRoadmaps);
router.get("/:id", getRoadmapById);
router.patch("/:id/progress", updateRoadmapProgress);   // <-- add
router.delete("/:id", deleteRoadmap);

export default router;