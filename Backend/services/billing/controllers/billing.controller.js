import razorpay from "../utils/razorpay.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import mongoose from "mongoose";
import redis from "../../../shared/redis/redis.js";
const coinPackages = {
    basic: {
        amount: 4900,
        coins: 100,
    },
    standard: {
        amount: 9900,
        coins: 250,
    },
    premium: {
        amount: 19900,
        coins: 600,
    },
    pro: {
        amount: 49900,
        coins: 1800,
    },
};

// CREATE RAZORPAY ORDER
export const createOrder = async (req, res) => {
    try {
        const { packageId } = req.body;

        // Validate package
        const selectedPackage = coinPackages[packageId];

        if (!selectedPackage) {
            return res.status(400).json({
                success: false,
                message: "Invalid coin package",
            });
        }

        // Get user from gateway headers
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: selectedPackage.amount,
            currency: "INR",
            receipt: `coin_${Date.now()}`,
            notes: {
                userId: user._id.toString(),
                packageId,
            },
        });

        // Save payment record
        const payment = await Payment.create({
            user: user._id,
            packageId,
            amount: selectedPackage.amount,
            coins: selectedPackage.coins,
            razorpayOrderId: order.id,
            status: "created",
        });

        return res.status(201).json({
            success: true,
            message: "Razorpay order created successfully",
            order,
            package: {
                packageId,
                coins: selectedPackage.coins,
            },
            paymentId: payment._id,
            key: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create payment order",
        });
    }
};
// VERIFY PAYMENT AND CREDIT COINS
export const verifyPayment = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const userId = req.headers["x-user-id"];

        // 1. Validate request
        if (
            !userId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing payment details"
            });
        }

        // 2. Find payment record
        const payment = await Payment.findOne({
            razorpayOrderId: razorpay_order_id,
            user: userId
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        // 3. Prevent duplicate credit
        if (payment.coinsCredited || payment.status === "paid") {
            return res.status(409).json({
                success: false,
                message: "Coins already credited"
            });
        }

        // 4. Generate expected signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        // 5. Compare signatures safely
        const expectedBuffer = Buffer.from(generatedSignature);
        const receivedBuffer = Buffer.from(razorpay_signature);

        if (
            expectedBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // 6. Verify payment with Razorpay
        const razorpayPayment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        if (
            razorpayPayment.order_id !== razorpay_order_id ||
            razorpayPayment.status !== "captured" ||
            razorpayPayment.amount !== payment.amount ||
            razorpayPayment.currency !== "INR"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment is not successfully captured"
            });
        }

        // 7. Atomically mark payment and credit coins
        let updatedUser;

        await session.withTransaction(async () => {

            const updatedPayment = await Payment.findOneAndUpdate(
                {
                    _id: payment._id,
                    status: "created",
                    coinsCredited: false
                },
                {
                    $set: {
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature,
                        status: "paid",
                        coinsCredited: true
                    }
                },
                {
                    new: true,
                    session
                }
            );

            if (!updatedPayment) {
                throw new Error("PAYMENT_ALREADY_PROCESSED");
            }

            updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $inc: {
                        interviewCoin: payment.coins
                    }
                },
                {
                    new: true,
                    session
                }
            );

            if (!updatedUser) {
                throw new Error("USER_NOT_FOUND");
            }
        });

        // 8. Update Redis session
        const sessionId = req.cookies?.session;

        if (sessionId) {
            const redisSession = await redis.get(`session:${sessionId}`);

            if (redisSession) {
                const sessionData = JSON.parse(redisSession);

                sessionData.interviewCoin = updatedUser.interviewCoin;

                await redis.set(
                    `session:${sessionId}`,
                    JSON.stringify(sessionData),
                    "EX",
                    7 * 24 * 60 * 60
                );
            }
        }

        // 9. Success response
        return res.status(200).json({
            success: true,
            message: "Payment verified and coins credited successfully",
            coinsAdded: payment.coins,
            interviewCoin: updatedUser.interviewCoin
        });

    } catch (error) {
        console.error("VERIFY PAYMENT ERROR:", error);

        if (error.message === "PAYMENT_ALREADY_PROCESSED") {
            return res.status(409).json({
                success: false,
                message: "Payment already processed"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });

    } finally {
        await session.endSession();
    }
};

// DEDUCT COINS FOR ROADMAP GENERATION
export const deductCoinsInternal = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId, amount, referenceId } = req.body;

    if (
      !mongoose.isValidObjectId(userId) ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !referenceId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }

    let updatedUser;

    await session.withTransaction(async () => {
      updatedUser = await User.findOneAndUpdate(
        {
          _id: userId,
          interviewCoin: { $gte: amount },
        },
        {
          $inc: { interviewCoin: -amount },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedUser) {
        const userExists = await User.exists({ _id: userId }).session(session);

        if (!userExists) {
          throw Object.assign(new Error("User not found"), { status: 404 });
        }

        throw Object.assign(
          new Error("Not enough interview coins"),
          { status: 402 }
        );
      }
    });

    return res.status(200).json({
      success: true,
      message: "Coins deducted successfully",
      interviewCoin: updatedUser.interviewCoin,
    });

  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Coin deduction failed",
    });
  } finally {
    await session.endSession();
  }
};


// REFUND COINS IF ROADMAP GENERATION FAILS
export const refundCoinsInternal = async (req, res) => {
  try {
    const { userId, amount, referenceId } = req.body;

    if (
      !mongoose.isValidObjectId(userId) ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !referenceId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { interviewCoin: amount },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coins refunded successfully",
      interviewCoin: updatedUser.interviewCoin,
    });

  } catch (error) {
    console.error("COIN REFUND ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Coin refund failed",
    });
  }
};