import mongoose from "mongoose";
const schema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actorName: { type: String, required: true },
  actorRole: { type: String, enum: ["admin", "lawyer"], required: true },
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: "LawyerProfile", default: null },
  action: { type: String, required: true },
  previous: mongoose.Schema.Types.Mixed,
  next: mongoose.Schema.Types.Mixed,
  reason: String,
}, { timestamps: true });
schema.index({ lawyer: 1, createdAt: -1 });
schema.index({ actorRole: 1, createdAt: -1 });
export default mongoose.model("ActivityLog", schema);
