import express from "express";
import { startInterview, submitAnswer, getInterview ,getDashboardStats} from "../controllers/interview.controller.js";
const interviewRouter = express.Router();

interviewRouter.post("/start",startInterview);
interviewRouter.post("/submit",submitAnswer);
interviewRouter.get("/get/:interviewId",getInterview);
interviewRouter.get("/dashboard-stats", getDashboardStats);

export default interviewRouter;