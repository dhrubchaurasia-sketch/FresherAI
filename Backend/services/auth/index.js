import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
dotenv.config();
import cors from "cors";
import { connectDB } from "./configs/db.js";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
const app = express();
app.use(express.json());
app.use(cors({
  origin:"http://localhost:5173",
  credentials:true
}))
app.use(morgan("dev"));
app.use(cookieParser());

const PORT = process.env.PORT || 6001;
app.get('/', (req, res) => {
  res.send('Auth server is running');
});

app.use("/", authRouter);
app.listen(PORT, () => {
  console.log(`Auth server is running on port ${PORT}`);
  connectDB();

});