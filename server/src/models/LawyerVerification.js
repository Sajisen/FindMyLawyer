import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const schema = new mongoose.Schema({
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: "LawyerProfile", required: true, unique: true },
  enrolmentNumber: { type: String, trim: true, default: "" },
  identityType: { type: String, enum: ["nic", "passport", null], default: null },
  documents: {
    certificate: documentSchema,
    nicFront: documentSchema,
    nicBack: documentSchema,
    passport: documentSchema,
  },
  status: {
    type: String,
    enum: ["pending_documents", "pending_review", "changes_requested", "verified"],
    default: "pending_documents",
  },
  reviewNote: { type: String, default: "" },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt: Date,
  submittedAt: Date,
}, { timestamps: true });

export default mongoose.model("LawyerVerification", schema);
