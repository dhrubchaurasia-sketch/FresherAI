import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import resumeRouter from "./routes/resume.route.js";

dotenv.config();


const app = express();
app.use(express.json());



const PORT = process.env.PORT || 8002;
app.get('/', (req, res) => {
  res.send('Resume service is running');
});

app.use("/",resumeRouter);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Resume service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();