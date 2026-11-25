
import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from "cors";
import { getCurrentUser } from "./controllers/user.controller.js";
import {  isAuth} from "./middleware/isAuth.js";
import cookieParser from "cookie-parser";
import { proxyWithHeaders } from "./utils/proxyWithHeaders.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use((req, res, next) => {
    res.setHeader(
        "Cross-Origin-Opener-Policy",
        "same-origin-allow-popups"
    );
    next();
});

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Gateway server is running");
});

app.use( "/api/auth", proxy(process.env.AUTH_SERVICE_URL, { proxyReqPathResolver: (req) => {  return req.url;  }}));
app.get("/api/me",isAuth,getCurrentUser);

app.use("/api/resume",isAuth,proxyWithHeaders(process.env.RESUME_SERVICE_URL));
app.use("/api/interview",isAuth,proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL));
app.use( "/api/billing", isAuth, proxyWithHeaders(process.env.BILLING_SERVICE_URL));
app.use("/api/roadmap",isAuth,proxyWithHeaders(process.env.ROADMAP_SERVICE_URL));

app.listen(PORT, () => {
    console.log(`Gateway server is running on port ${PORT}`);
    console.log(`Auth Service URL: ${process.env.AUTH_SERVICE_URL}`);
});



