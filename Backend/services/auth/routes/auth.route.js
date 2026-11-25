import express from "express";
import { GoogleAuth, Logout,useCoins } from "../controllers/auth.controller.js";
const  authRouter = express.Router();

authRouter.post("/login",GoogleAuth);
authRouter.get("/logout",Logout);



authRouter.post("/use-coins", (req, res, next) => {
//   console.log(" USE COINS ROUTE MATCHED");
  next();
}, useCoins);
export default authRouter;