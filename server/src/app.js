import express from "express";
import cors from "cors";
import { PROFILE_IMAGE_DIRECTORY } from "./services/profileImageStorage.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import lawyerRoutes from "./routes/lawyerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import savedLawyerRoutes from "./routes/savedLawyerRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);

app.use(
  "/uploads/profile-images",
  express.static(PROFILE_IMAGE_DIRECTORY, {
    dotfiles: "deny",
    index: false,
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  })
);

const standardJsonParser = express.json({ limit: "25kb" });

app.use((req, res, next) => {
  const normalizedPath = req.path.replace(/\/+$/, "") || "/";
  const isVerificationUpload =
    req.method === "POST" &&
    normalizedPath === "/api/lawyers/me/verification";

  if (isVerificationUpload) {
    return next();
  }

  return standardJsonParser(req, res, next);
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Find My Lawyer API is running",
  });
});

const aiBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many Advanced Search requests were sent in a short time. Please wait a minute and try again.",
  },
});

const aiHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "The Advanced Search request limit has been reached. Please try again later.",
  },
});

app.use("/api/lawyers", lawyerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/saved-lawyers", savedLawyerRoutes);
app.use("/api/ai", aiHourlyLimiter, aiBurstLimiter, aiRoutes);

app.use((error, req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      message: "The request is too large. Reduce the uploaded file sizes and try again.",
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON request body." });
  }

  return next(error);
});

export default app;
