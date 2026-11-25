import Razorpay from "razorpay";
import "dotenv/config";


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
console.log("Razorpay Key ID loaded:", !!process.env.RAZORPAY_KEY_ID);
console.log("Razorpay Secret loaded:", !!process.env.RAZORPAY_KEY_SECRET);

export default razorpay;