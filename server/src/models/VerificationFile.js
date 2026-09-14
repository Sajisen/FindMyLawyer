import mongoose from "mongoose";
const schema = new mongoose.Schema({
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: "LawyerProfile", required: true },
  submission: { type: mongoose.Schema.Types.ObjectId, required: true },
  slot: { type: String, required: true },
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  data: { type: Buffer, required: true, select: false },
}, { timestamps: true });
schema.index({ lawyer: 1, submission: 1 });
export default mongoose.model("VerificationFile", schema);
