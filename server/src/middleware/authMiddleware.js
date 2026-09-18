import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId)
      .select("_id role email isActive authVersion")
      .lean();

    if (!user) {
      return res.status(401).json({
        message: "User account no longer exists.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "This account has been disabled. Contact an administrator if you believe this is a mistake.",
      });
    }

    const currentVersion = Number(user.authVersion || 0);
    const tokenVersion = Number(decoded.authVersion || 0);

    if (currentVersion !== tokenVersion) {
      return res.status(401).json({
        message: "Your sign-in session is no longer valid. Please sign in again.",
      });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email,
      authVersion: currentVersion,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
};
