import express from "express";

import {
  registerClient,
  registerLawyer,
  login,
  getCurrentUser,
  updateCurrentUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  loginLimiter,
  registrationLimiter,
} from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/register/client", registrationLimiter, registerClient);
router.post("/register/lawyer", registrationLimiter, registerLawyer);
router.post("/login", loginLimiter, login);
router.get("/me", protect, getCurrentUser);
router.patch("/me", protect, updateCurrentUser);

export default router;
