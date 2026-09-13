import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import lawyerRoutes from "./routes/lawyerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "25kb" }));

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
app.use("/api/ai", aiHourlyLimiter, aiBurstLimiter, aiRoutes);

export default app;
