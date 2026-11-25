import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { connectDB } from "./configs/db.js";
import billingRouter from "./routes/billing.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8006;

app.use(express.json());

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Billing Service is running");
});

app.use("/", billingRouter);

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Billing Service running on port ${PORT}`);
    });
};

startServer();