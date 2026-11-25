import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    duration: { type: String, trim: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    description: { type: String, trim: true },

    // NEW
    topics: { type: [String], default: [] },
    outcome: { type: String, trim: true },
    practiceTask: { type: String, trim: true },
    interviewQuestions: { type: [String], default: [] },

    // attached by resource agent
    youtube: { type: String },
    article: { type: String },
    practice: { type: String },
    course: { type: String },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    targetPackage: { type: String, trim: true },
    duration: { type: String, trim: true },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },

    // NEW
    capstoneProject: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
    },
    completedModules: { type: [Number], default: [] },
    modules: { type: [moduleSchema], default: [] },
  },
  { timestamps: true }
);

const Roadmap = mongoose.model("Roadmap", roadmapSchema);

export default Roadmap;
