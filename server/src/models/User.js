import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["client", "lawyer", "admin"],
      default: "client",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Incremented after security-sensitive account changes. JWTs carry the
    // version they were issued with, allowing password/email changes and admin
    // deactivation to invalidate older sessions without storing server sessions.
    authVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;