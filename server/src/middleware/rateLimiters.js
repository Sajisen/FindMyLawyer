import { rateLimit } from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message: "Too many unsuccessful sign-in attempts. Please wait and try again.",
  },
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many registration attempts. Please wait and try again later.",
  },
});


export const verificationUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  keyGenerator: (req) => String(req.user.userId),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many verification submissions were sent. Please wait and try again later.",
  },
});

export const profileImageUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user.userId),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many profile image changes were sent. Please wait and try again.",
  },
});

export const accountOtpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many verification-code requests. Please wait and try again.",
  },
});

export const accountOtpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many verification attempts. Please wait and try again.",
  },
});

export const accountSecurityLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user.userId),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many account-security changes. Please wait and try again.",
  },
});
