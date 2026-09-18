import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  number: Number,
  identityType: String,
  enrolmentNumber: String,
  files: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      slot: String,
      name: String,
      mimeType: String,
    },
  ],
  submittedAt: { type: Date, default: Date.now },
});

const schema = new mongoose.Schema(
  {
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawyerProfile",
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "rejected", "approved"],
      default: "pending",
    },
    reason: { type: String, default: "" },
    rejectionScope: {
      type: String,
      enum: ["profile", "documents", "both"],
      default: undefined,
    },
    submissions: [submissionSchema],
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Verification", schema);
