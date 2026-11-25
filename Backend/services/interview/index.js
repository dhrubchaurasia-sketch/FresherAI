import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import interviewRouter from "./routes/interview.route.js";
dotenv.config();


const app = express();
app.use(express.json());



const PORT = process.env.PORT || 8003;
app.get('/', (req, res) => {
  res.send('Interview service is running');
});

app.use("/", interviewRouter);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Interview service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();