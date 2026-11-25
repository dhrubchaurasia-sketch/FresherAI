import mongoose from "mongoose";

// Education Schema
const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      default: "",
    },
    institution: {
      type: String,
      default: "",
    },
    period: {
      type: String,
      default: "",
    },
    details: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

// Experience Schema
const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    company: {
      type: String,
      default: "",
    },
    year: {
      type: String,
      default: "",
    },
    details: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

// Projects Schema
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    technologies: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

// Main Resume Schema
const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    extractedText: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },
    scoreBreakdown: {
      skills: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      experience: { type: Number, default: 0 },
      education: { type: Number, default: 0 },
      formatting: { type: Number, default: 0 },
      summary: { type: Number, default: 0 },
    },

    summary: {
      type: String,
      default: "",
    },

    name: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    education: {
      type: [educationSchema],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
    },

    projects: {
      type: [projectSchema],
      default: [],
    },

    experience: {
      type: [experienceSchema],
      default: [],
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    suggestedRole: {
      type: String,
      default: "",
    },

    recommendations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
