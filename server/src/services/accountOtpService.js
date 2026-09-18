import crypto from "node:crypto";

import AccountOtp from "../models/AccountOtp.js";

export const ACCOUNT_OTP_TTL_MINUTES = 10;
export const ACCOUNT_OTP_MAX_ATTEMPTS = 5;
export const ACCOUNT_OTP_RESEND_SECONDS = 60;

export class AccountOtpError extends Error {
  constructor(message, statusCode = 400, code = "OTP_ERROR") {
    super(message);
    this.name = "AccountOtpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function otpSecret() {
  const value = process.env.ACCOUNT_OTP_SECRET || process.env.JWT_SECRET;

  if (!value) {
    throw new Error("ACCOUNT_OTP_SECRET or JWT_SECRET is required for OTP hashing.");
  }

  return value;
}

export function normalizeAccountEmail(value = "") {
  return String(value).trim().toLowerCase();
}

export function generateOtpCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function createOtpHash(challengeId, code) {
  return crypto
    .createHmac("sha256", otpSecret())
    .update(`${challengeId}:${String(code)}`)
    .digest("hex");
}

export function otpHashesMatch(challengeId, code, expectedHash) {
  const actual = Buffer.from(createOtpHash(challengeId, code), "hex");
  const expected = Buffer.from(String(expectedHash || ""), "hex");

  return (
    actual.length === expected.length &&
    actual.length > 0 &&
    crypto.timingSafeEqual(actual, expected)
  );
}

export function getAccountOtpDeliveryMode() {
  const configured = String(process.env.ACCOUNT_OTP_DELIVERY || "")
    .trim()
    .toLowerCase();

  if (configured) {
    return configured;
  }

  return process.env.NODE_ENV === "production" ? "disabled" : "console";
}

function purposeLabel(purpose) {
  return purpose === "email_change" ? "email change" : "password reset";
}

export function deliverAccountOtp({ email, purpose, code, expiresAt }) {
  const mode = getAccountOtpDeliveryMode();

  if (mode !== "console") {
    throw new AccountOtpError(
      "Verification-code delivery is not configured on this server.",
      503,
      "OTP_DELIVERY_UNAVAILABLE"
    );
  }

  // Development-only delivery. Never return the code to the browser and never
  // store the plaintext value in MongoDB.
  console.log("");
  console.log("============================================================");
  console.log(`[DEV OTP] ${purposeLabel(purpose).toUpperCase()}`);
  console.log(`[DEV OTP] Destination: ${email}`);
  console.log(`[DEV OTP] Code: ${code}`);
  console.log(`[DEV OTP] Expires: ${expiresAt.toISOString()}`);
  console.log("============================================================");
  console.log("");
}

export async function issueAccountOtp({
  userId,
  purpose,
  targetEmail = "",
  reuseDuringCooldown = false,
}) {
  const now = new Date();
  const existing = await AccountOtp.findOne({
    userId,
    purpose,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .select("challengeId createdAt expiresAt")
    .lean();

  if (existing?.createdAt) {
    const elapsedSeconds = Math.floor(
      (now.getTime() - new Date(existing.createdAt).getTime()) / 1000
    );

    if (elapsedSeconds < ACCOUNT_OTP_RESEND_SECONDS) {
      if (reuseDuringCooldown) {
        return {
          challengeId: existing.challengeId,
          expiresAt: existing.expiresAt,
          resendAfterSeconds: ACCOUNT_OTP_RESEND_SECONDS - elapsedSeconds,
          delivery: getAccountOtpDeliveryMode(),
          reused: true,
        };
      }

      throw new AccountOtpError(
        `Please wait ${ACCOUNT_OTP_RESEND_SECONDS - elapsedSeconds} seconds before requesting another code.`,
        429,
        "OTP_RESEND_TOO_SOON"
      );
    }
  }

  await AccountOtp.deleteMany({ userId, purpose });

  const challengeId = crypto.randomUUID();
  const code = generateOtpCode();
  const expiresAt = new Date(
    now.getTime() + ACCOUNT_OTP_TTL_MINUTES * 60 * 1000
  );

  const record = await AccountOtp.create({
    challengeId,
    userId,
    purpose,
    targetEmail: normalizeAccountEmail(targetEmail),
    codeHash: createOtpHash(challengeId, code),
    attempts: 0,
    expiresAt,
  });

  try {
    deliverAccountOtp({
      email: normalizeAccountEmail(targetEmail),
      purpose,
      code,
      expiresAt,
    });
  } catch (error) {
    await AccountOtp.deleteOne({ _id: record._id });
    throw error;
  }

  return {
    challengeId,
    expiresAt,
    resendAfterSeconds: ACCOUNT_OTP_RESEND_SECONDS,
    delivery: getAccountOtpDeliveryMode(),
  };
}

export async function validateAccountOtp({
  challengeId,
  purpose,
  code,
  userId,
}) {
  const cleanChallengeId = String(challengeId || "").trim();
  const cleanCode = String(code || "").trim();

  if (!cleanChallengeId || !/^\d{6}$/.test(cleanCode)) {
    throw new AccountOtpError(
      "Enter the valid 6-digit verification code.",
      400,
      "OTP_INVALID"
    );
  }

  const query = {
    challengeId: cleanChallengeId,
    purpose,
  };

  if (userId) {
    query.userId = userId;
  }

  const record = await AccountOtp.findOne(query);

  if (!record) {
    throw new AccountOtpError(
      "This verification request is invalid or has expired.",
      400,
      "OTP_INVALID_OR_EXPIRED"
    );
  }

  if (record.expiresAt <= new Date()) {
    await AccountOtp.deleteOne({ _id: record._id });
    throw new AccountOtpError(
      "This verification code has expired. Request a new code.",
      400,
      "OTP_EXPIRED"
    );
  }

  if (record.attempts >= ACCOUNT_OTP_MAX_ATTEMPTS) {
    await AccountOtp.deleteOne({ _id: record._id });
    throw new AccountOtpError(
      "Too many incorrect attempts. Request a new verification code.",
      429,
      "OTP_ATTEMPTS_EXCEEDED"
    );
  }

  if (!otpHashesMatch(record.challengeId, cleanCode, record.codeHash)) {
    record.attempts += 1;

    if (record.attempts >= ACCOUNT_OTP_MAX_ATTEMPTS) {
      await AccountOtp.deleteOne({ _id: record._id });
      throw new AccountOtpError(
        "Too many incorrect attempts. Request a new verification code.",
        429,
        "OTP_ATTEMPTS_EXCEEDED"
      );
    }

    await record.save();
    throw new AccountOtpError(
      `Incorrect verification code. ${ACCOUNT_OTP_MAX_ATTEMPTS - record.attempts} attempts remaining.`,
      400,
      "OTP_INCORRECT"
    );
  }

  return record;
}

export function otpResponseMeta(result) {
  return {
    challengeId: result.challengeId,
    expiresAt: result.expiresAt,
    resendAfterSeconds: result.resendAfterSeconds,
    delivery: result.delivery,
  };
}
