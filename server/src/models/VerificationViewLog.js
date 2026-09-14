import mongoose from "mongoose";

const schema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: "LawyerProfile", required: true },
  documentType: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("VerificationViewLog", schema);
