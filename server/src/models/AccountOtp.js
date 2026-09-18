import mongoose from "mongoose";

const accountOtpSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["email_change", "password_reset"],
      required: true,
      index: true,
    },
    targetEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    codeHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB's TTL monitor removes expired OTP documents automatically. Controllers
// also reject/delete an expired challenge immediately so correctness does not
// depend on the TTL monitor's approximate cleanup interval.
accountOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
accountOtpSchema.index({ userId: 1, purpose: 1, createdAt: -1 });

const AccountOtp = mongoose.model("AccountOtp", accountOtpSchema);

export default AccountOtp;
