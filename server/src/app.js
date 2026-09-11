import express from "express";
import cors from "cors";
import helmet from "helmet";

import lawyerRoutes from "./routes/lawyerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Find My Lawyer API is running",
  });
});

app.use("/api/lawyers", lawyerRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

export default app;