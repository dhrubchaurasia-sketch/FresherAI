import express from "express";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import roadmapRouter from "./routes/roadmap.route.js";


const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8008;

app.get("/", (req, res) => {
  res.send("Roadmap service is running");
});

// Mount roadmap routes
app.use("/", roadmapRouter);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Roadmap service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Roadmap service:", error);
    process.exit(1);
  }
};

startServer();