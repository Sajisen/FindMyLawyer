import jwt from "jsonwebtoken";

export function createAuthToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      authVersion: Number(user.authVersion || 0),
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}
