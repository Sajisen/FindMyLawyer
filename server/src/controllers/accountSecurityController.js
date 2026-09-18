import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import AccountOtp from "../models/AccountOtp.js";
import User from "../models/User.js";
import { createAuthToken } from "../services/authTokenService.js";
import {
  ACCOUNT_OTP_TTL_MINUTES,
  AccountOtpError,
  getAccountOtpDeliveryMode,
  issueAccountOtp,
  normalizeAccountEmail,
  otpResponseMeta,
  validateAccountOtp,
} from "../services/accountOtpService.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function userPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function validateNewPassword(value) {
  const password = String(value || "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AccountOtpError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      400,
      "PASSWORD_TOO_SHORT"
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AccountOtpError(
      `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`,
      400,
      "PASSWORD_TOO_LONG"
    );
  }

  return password;
}

function handleKnownError(error, res, fallbackMessage) {
  if (error instanceof AccountOtpError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
    });
  }

  if (error?.code === 11000) {
    return res.status(409).json({
      message: "An account with this email already exists.",
    });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}

export const requestEmailChange = async (req, res) => {
  try {
    const newEmail = normalizeAccountEmail(req.body.newEmail);
    const currentPassword = String(req.body.currentPassword || "");

    if (!EMAIL_PATTERN.test(newEmail)) {
      return res.status(400).json({ message: "Enter a valid new email address." });
    }

    if (!currentPassword) {
      return res.status(400).json({ message: "Enter your current password." });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    if (newEmail === user.email) {
      return res.status(400).json({
        message: "The new email address must be different from your current email.",
      });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Your current password is incorrect." });
    }

    if (await User.exists({ email: newEmail, _id: { $ne: user._id } })) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const result = await issueAccountOtp({
      userId: user._id,
      purpose: "email_change",
      targetEmail: newEmail,
    });

    return res.json({
      message:
        result.delivery === "console"
          ? "Verification code created. In this development build, check the server terminal for the OTP."
          : "Verification code sent to the new email address.",
      ...otpResponseMeta(result),
    });
  } catch (error) {
    return handleKnownError(error, res, "Failed to start email change.");
  }
};

export const verifyEmailChange = async (req, res) => {
  let session;

  try {
    const challengeId = String(req.body.challengeId || "").trim();
    const code = String(req.body.code || "").trim();
    const otp = await validateAccountOtp({
      challengeId,
      purpose: "email_change",
      code,
      userId: req.user.userId,
    });

    session = await mongoose.startSession();
    let responseData;

    await session.withTransaction(async () => {
      const liveOtp = await AccountOtp.findOne({
        _id: otp._id,
        challengeId,
        purpose: "email_change",
        userId: req.user.userId,
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (!liveOtp) {
        throw new AccountOtpError(
          "This verification request is invalid or has expired.",
          400,
          "OTP_INVALID_OR_EXPIRED"
        );
      }

      const user = await User.findById(req.user.userId).session(session);
      if (!user || user.isActive === false) {
        throw new AccountOtpError("User account is unavailable.", 403, "ACCOUNT_UNAVAILABLE");
      }

      const targetEmail = normalizeAccountEmail(liveOtp.targetEmail);
      if (!EMAIL_PATTERN.test(targetEmail)) {
        throw new AccountOtpError(
          "The requested email change is no longer valid.",
          400,
          "EMAIL_CHANGE_INVALID"
        );
      }

      const emailOwner = await User.findOne({
        email: targetEmail,
        _id: { $ne: user._id },
      })
        .session(session)
        .select("_id")
        .lean();

      if (emailOwner) {
        throw new AccountOtpError(
          "An account with this email already exists.",
          409,
          "EMAIL_IN_USE"
        );
      }

      user.email = targetEmail;
      user.authVersion = Number(user.authVersion || 0) + 1;
      await user.save({ session });

      await AccountOtp.deleteMany({ userId: user._id }).session(session);

      responseData = {
        token: createAuthToken(user),
        user: userPayload(user),
      };
    });

    return res.json({
      message: "Sign-in email changed successfully. Other signed-in sessions were revoked.",
      ...responseData,
    });
  } catch (error) {
    return handleKnownError(error, res, "Failed to verify email change.");
  } finally {
    if (session) await session.endSession();
  }
};

export const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = validateNewPassword(req.body.newPassword);

    if (!currentPassword) {
      return res.status(400).json({ message: "Enter your current password." });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentMatches) {
      return res.status(401).json({ message: "Your current password is incorrect." });
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return res.status(400).json({
        message: "Choose a password that is different from your current password.",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.authVersion = Number(user.authVersion || 0) + 1;
    await user.save();

    await AccountOtp.deleteMany({ userId: user._id });

    return res.json({
      message: "Password changed successfully. Other signed-in sessions were revoked.",
      token: createAuthToken(user),
      user: userPayload(user),
    });
  } catch (error) {
    return handleKnownError(error, res, "Failed to change password.");
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const email = normalizeAccountEmail(req.body.email);

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const deliveryMode = getAccountOtpDeliveryMode();
    if (deliveryMode !== "console") {
      throw new AccountOtpError(
        "Verification-code delivery is not configured on this server.",
        503,
        "OTP_DELIVERY_UNAVAILABLE"
      );
    }

    const user = await User.findOne({ email }).select("_id email isActive").lean();
    const fakeChallengeId = crypto.randomUUID();
    const fakeExpiresAt = new Date(
      Date.now() + ACCOUNT_OTP_TTL_MINUTES * 60 * 1000
    );

    if (!user || user.isActive === false) {
      // Keep the public response shape the same so the endpoint does not reveal
      // whether an account exists or whether it has been disabled.
      return res.json({
        message:
          "If an active account exists for that email, a reset code has been created.",
        challengeId: fakeChallengeId,
        expiresAt: fakeExpiresAt,
        resendAfterSeconds: 60,
        delivery: deliveryMode,
      });
    }

    const result = await issueAccountOtp({
      userId: user._id,
      purpose: "password_reset",
      targetEmail: user.email,
      reuseDuringCooldown: true,
    });

    return res.json({
      message:
        result.delivery === "console"
          ? "If an active account exists for that email, a reset code has been created. In this development build, check the server terminal for the OTP."
          : "If an active account exists for that email, a reset code has been sent.",
      ...otpResponseMeta(result),
    });
  } catch (error) {
    // Password-reset requests intentionally avoid account-specific errors.
    if (error instanceof AccountOtpError && error.code === "OTP_DELIVERY_UNAVAILABLE") {
      return res.status(error.statusCode).json({ message: error.message, code: error.code });
    }

    console.error("Password reset request error:", error);
    return res.status(500).json({ message: "Unable to start password reset." });
  }
};

export const confirmPasswordReset = async (req, res) => {
  let session;

  try {
    const challengeId = String(req.body.challengeId || "").trim();
    const code = String(req.body.code || "").trim();
    const newPassword = validateNewPassword(req.body.newPassword);
    const otp = await validateAccountOtp({
      challengeId,
      purpose: "password_reset",
      code,
    });

    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const liveOtp = await AccountOtp.findOne({
        _id: otp._id,
        challengeId,
        purpose: "password_reset",
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (!liveOtp) {
        throw new AccountOtpError(
          "This reset request is invalid or has expired.",
          400,
          "OTP_INVALID_OR_EXPIRED"
        );
      }

      const user = await User.findById(liveOtp.userId).session(session);
      if (!user || user.isActive === false) {
        throw new AccountOtpError(
          "This reset request is invalid or has expired.",
          400,
          "OTP_INVALID_OR_EXPIRED"
        );
      }

      if (await bcrypt.compare(newPassword, user.passwordHash)) {
        throw new AccountOtpError(
          "Choose a password that is different from your current password.",
          400,
          "PASSWORD_REUSED"
        );
      }

      user.passwordHash = await bcrypt.hash(newPassword, 12);
      user.authVersion = Number(user.authVersion || 0) + 1;
      await user.save({ session });

      await AccountOtp.deleteMany({ userId: user._id }).session(session);
    });

    return res.json({
      message: "Password reset successfully. You can now sign in with the new password.",
    });
  } catch (error) {
    return handleKnownError(error, res, "Failed to reset password.");
  } finally {
    if (session) await session.endSession();
  }
};
