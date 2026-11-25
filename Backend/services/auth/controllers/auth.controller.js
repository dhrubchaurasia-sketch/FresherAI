import { app } from "../configs/firebase.js";
import { getAuth } from "firebase-admin/auth";
import User from "../models/user.model.js";
import crypto from "crypto";
import redis from "../../../shared/redis/redis.js";
export const GoogleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = await getAuth(app).verifyIdToken(token);
    // console.log("GOOGLE EMAIL:", decoded.email);
    // console.log("FIREBASE UID:", decoded.uid);

    let user = await User.findOne({ firebaseUid: decoded.uid });

    // console.log("EXISTING USER:", user);

    // let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = new User({
        firebaseUid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        interviewCoin: 150,
      });
      await user.save();
    }
    const sessionId = crypto.randomUUID();

    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        userId: user._id,
        name: user.name,
        email: user.email,
        interviewCoin: user.interviewCoin,
      }),
      "EX",
      7 * 24 * 60 * 60,
    ); // Set session in Redis with 7 days expiration
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "Authentication successful", user });
  } catch (error) {
    console.error("Error in GoogleAuth:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const Logout = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;
    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }
    res.clearCookie("session", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Error in Logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const useCoins = async (req, res) => {
try {
// 1. Get session ID from cookie
const sessionId = req.cookies?.session;


if (!sessionId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
}

// 2. Verify session from Redis
const session = await redis.get(`session:${sessionId}`);

if (!session) {
  return res.status(401).json({
    success: false,
    message: "Session expired"
  });
}

const sessionData = JSON.parse(session);

// 3. Get coins and action from request body
const { action } = req.body;

const actionCosts = {
  resume: 20,
  interview: 50,
  "resume-builder": 15,
};

if (!Object.hasOwn(actionCosts, action)) {
  return res.status(400).json({
    success: false,
    message: "Invalid action"
  });
}

const coins = actionCosts[action];

// 4. Validate coins
if (!Number.isInteger(coins) || coins <= 0) {
  return res.status(400).json({
    success: false,
    message: "Valid coins amount is required"
  });
}


// 6. Atomically deduct coins from MongoDB
const user = await User.findOneAndUpdate(
  {
    _id: sessionData.userId,
    interviewCoin: { $gte: coins }
  },
  {
    $inc: { interviewCoin: -coins }
  },
  {
    new: true,
    runValidators: true
  }
);

// 7. Check user and coin balance
if (!user) {
  const existingUser = await User.findById(sessionData.userId);

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  return res.status(400).json({
    success: false,
    message: "Not enough interview coins",
    interviewCoin: existingUser.interviewCoin
  });
}

// 8. Update Redis session
await redis.set(
  `session:${sessionId}`,
  JSON.stringify({
    userId: user._id,
    name: user.name,
    email: user.email,
    interviewCoin: user.interviewCoin
  }),
  "EX",
  7 * 24 * 60 * 60
);

// 9. Send success response
return res.status(200).json({
  success: true,
  message: "Interview coins deducted successfully",
  action,
  interviewCoin: user.interviewCoin
});


} catch (error) {
console.error("Error in useCoins:", error);


return res.status(500).json({
  success: false,
  message: "Internal server error"
});


}
};
