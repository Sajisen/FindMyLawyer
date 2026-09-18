import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorRole: {
      type: String,
      enum: ["admin", "lawyer"],
      required: true,
    },
    lawyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawyerProfile",
      required: true,
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    documentType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

schema.index({ lawyerId: 1, createdAt: -1 });
schema.index({ actorId: 1, createdAt: -1 });

export default mongoose.model("VerificationViewLog", schema);
