import mongoose from "mongoose";
import Verification from "../models/Verification.js";
import LawyerProfile from "../models/LawyerProfile.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import VerificationFile from "../models/VerificationFile.js";

const slots = { certificate: ["application/pdf"], nicFront: ["image/jpeg", "image/png"], nicBack: ["image/jpeg", "image/png"], passport: ["image/jpeg", "image/png"] };
const metadata = (record) => record && ({
  _id: record._id, status: record.status, reason: record.reason,
  reviewedAt: record.reviewedAt, reviewedBy: record.reviewedBy,
  submissions: record.submissions.map((item) => ({
    _id: item._id, number: item.number, identityType: item.identityType,
    enrolmentNumber: item.enrolmentNumber, submittedAt: item.submittedAt,
    files: item.files.map((file) => ({ _id: file._id, slot: file.slot, name: file.name, mimeType: file.mimeType })),
  })),
});
export const getMine = async (req, res) => {
  const profile = await LawyerProfile.findOne({ userId: req.user.userId, isDemo: { $ne: true } });
  if (!profile) return res.status(404).json({ message: "Profile not found." });
  const record = await Verification.findOne({ lawyer: profile._id });
  res.json({ verification: metadata(record) });
};
export const submit = async (req, res) => {
  const profile = await LawyerProfile.findOne({ userId: req.user.userId, isDemo: { $ne: true } });
  if (!profile) return res.status(404).json({ message: "Profile not found." });
  const current = await Verification.findOne({ lawyer: profile._id });
  if (current && current.status !== "rejected") return res.status(409).json({ message: "Only rejected submissions may be resubmitted." });
  const { identityType, enrolmentNumber, files } = req.body;
  if (!["nic", "passport"].includes(identityType) || typeof enrolmentNumber !== "string" || !enrolmentNumber.trim() || enrolmentNumber.length > 100 || !Array.isArray(files)) return res.status(400).json({ message: "Invalid verification details." });
  const required = identityType === "nic" ? ["certificate", "nicFront", "nicBack"] : ["certificate", "passport"];
  if (files.length !== required.length || new Set(files.map((f) => f.slot)).size !== required.length || required.some((slot) => !files.some((f) => f.slot === slot))) return res.status(400).json({ message: "Provide the certificate and required identity documents." });
  const prepared = [];
  for (const file of files) {
    if (!file || !slots[file.slot]?.includes(file.mimeType) || typeof file.name !== "string" || file.name.length > 150 || typeof file.data !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(file.data)) return res.status(400).json({ message: "Invalid document." });
    const data = Buffer.from(file.data, "base64");
    if (!data.length || data.length > 3 * 1024 * 1024 || (file.mimeType === "application/pdf" ? data.subarray(0, 5).toString() !== "%PDF-" : file.mimeType === "image/png" ? !data.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) : !data.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")))) return res.status(400).json({ message: "Document contents do not match the selected file type or exceed 3 MB." });
    prepared.push({ slot: file.slot, mimeType: file.mimeType, name: file.name, data });
  }
  const actor = await User.findById(req.user.userId).select("name");
  const record = current || new Verification({ lawyer: profile._id });
  const submissionId = new mongoose.Types.ObjectId();
  const stored = await VerificationFile.insertMany(prepared.map((file) => ({ ...file, lawyer: profile._id, submission: submissionId })));
  record.submissions.push({ _id: submissionId, number: record.submissions.length + 1, identityType, enrolmentNumber: enrolmentNumber.trim(), files: stored.map((file) => ({ _id: file._id, slot: file.slot, name: file.name, mimeType: file.mimeType })) });
  const previous = { status: current?.status || "unsubmitted", reason: current?.reason || "" };
  record.status = "pending";
  record.reason = "";
  record.reviewedBy = undefined;
  record.reviewedAt = undefined;
  profile.isPublished = false;
  profile.rejectionReason = null;
  profile.verifiedAt = null;
  profile.verifiedBy = null;
  try { await record.save(); await profile.save(); } catch (error) {
    await VerificationFile.deleteMany({ submission: submissionId, lawyer: profile._id });
    throw error;
  }
  await ActivityLog.create({ actor: req.user.userId, actorName: actor.name, actorRole: "lawyer", lawyer: profile._id, action: current ? "verification_resubmitted" : "verification_submitted", previous, next: { status: "pending", submission: record.submissions.length } });
  res.status(201).json({ verification: metadata(record) });
};
export const viewFile = async (req, res) => {
  const { lawyerId, submissionId, fileId } = req.params;
  if (![lawyerId, submissionId, fileId].every(mongoose.isValidObjectId)) return res.status(400).json({ message: "Invalid document ID." });
  const profile = await LawyerProfile.findById(lawyerId);
  if (!profile || (req.user.role !== "admin" && String(profile.userId) !== String(req.user.userId))) return res.status(404).json({ message: "Document not found." });
  const record = await Verification.findOne({ lawyer: lawyerId });
  if (!record?.submissions.id(submissionId)?.files.id(fileId)) return res.status(404).json({ message: "Document not found." });
  const file = await VerificationFile.findOne({ _id: fileId, lawyer: lawyerId, submission: submissionId }).select("+data");
  if (!file) return res.status(404).json({ message: "Document not found." });
  res.set({ "Content-Type": file.mimeType, "Content-Disposition": "inline", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.send(file.data);
};
export const getLawyerVerification = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid lawyer ID." });
  const record = await Verification.findOne({ lawyer: req.params.id });
  res.json({ verification: metadata(record) });
};
