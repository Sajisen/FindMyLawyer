import express from "express";

import {
  registerClient,
  registerLawyer,
  login,
  getCurrentUser,
  updateCurrentUser,
} from "../controllers/authController.js";
import {
  changePassword,
  confirmPasswordReset,
  requestEmailChange,
  requestPasswordReset,
  verifyEmailChange,
} from "../controllers/accountSecurityController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  accountOtpRequestLimiter,
  accountOtpVerifyLimiter,
  accountSecurityLimiter,
  loginLimiter,
  registrationLimiter,
} from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/register/client", registrationLimiter, registerClient);
router.post("/register/lawyer", registrationLimiter, registerLawyer);
router.post("/login", loginLimiter, login);

// Public recovery flow. The request endpoint returns the same response shape for
// missing/disabled accounts and never returns the OTP itself.
router.post(
  "/password/reset/request",
  accountOtpRequestLimiter,
  requestPasswordReset
);
router.post(
  "/password/reset/confirm",
  accountOtpVerifyLimiter,
  confirmPasswordReset
);

router.get("/me", protect, getCurrentUser);
router.patch("/me", protect, updateCurrentUser);
router.post(
  "/me/email-change/request",
  protect,
  accountSecurityLimiter,
  accountOtpRequestLimiter,
  requestEmailChange
);
router.post(
  "/me/email-change/verify",
  protect,
  accountSecurityLimiter,
  accountOtpVerifyLimiter,
  verifyEmailChange
);
router.post(
  "/me/password/change",
  protect,
  accountSecurityLimiter,
  changePassword
);

export default router;
