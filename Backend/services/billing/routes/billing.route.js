import express from "express";
import { createOrder ,verifyPayment,deductCoinsInternal,refundCoinsInternal} from "../controllers/billing.controller.js";

const billingRouter = express.Router();

// Create Razorpay Order
billingRouter.post("/create-order", createOrder);
billingRouter.post("/verify-payment", verifyPayment);
billingRouter.post("/internal/coins/deduct", deductCoinsInternal);
billingRouter.post("/internal/coins/refund", refundCoinsInternal);
export default billingRouter;