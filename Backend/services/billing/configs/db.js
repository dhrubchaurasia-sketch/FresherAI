import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Billing MongoDB connected successfully");
  } catch (error) {
    console.error("Billing MongoDB connection error:", error);
    process.exit(1);
  }
};




