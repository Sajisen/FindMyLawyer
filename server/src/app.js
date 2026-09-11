import express from "express";
import cors from "cors";
import helmet from "helmet";

import lawyerRoutes from "./modules/lawyers/lawyer.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.CLIENT_ORIGIN ||
      "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message:
      "FindMyLawyer API is running",
  });
});

app.use(
  "/api/lawyers",
  lawyerRoutes
);

export default app;