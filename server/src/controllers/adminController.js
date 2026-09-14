import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import LawyerProfile from "../models/LawyerProfile.js";
import User from "../models/User.js";
import Verification from "../models/Verification.js";
import ActivityLog from "../models/ActivityLog.js";
import { applyPendingProfileChanges } from "../services/lawyerProfileReviewService.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const realLawyers = { isDemo: { $ne: true } };
const statusOf = (lawyer, record) => record?.status || (lawyer.isPublished ? "approved" : lawyer.rejectionReason ? "rejected" : "pending");
async function actorName(id) {
  const user = await User.findById(id).select("name");
  return user?.name || "Unknown admin";
}
async function recordAction(req, lawyer, action, previous, next, reason = "") {
  return ActivityLog.create({ actor: req.user.userId, actorName: await actorName(req.user.userId), actorRole: "admin", lawyer, action, previous, next, reason });
}
export const getAllLawyers = async (req, res) => {
  try {
    const lawyers = await LawyerProfile.find(realLawyers).populate("userId", "name email role").sort({ updatedAt: -1 });
    const records = await Verification.find({ lawyer: { $in: lawyers.map((lawyer) => lawyer._id) } }).select("lawyer status submissions.number");
    const byLawyer = new Map(records.map((record) => [String(record.lawyer), record]));
    res.json({ lawyers: lawyers.map((lawyer) => {
      const record = byLawyer.get(String(lawyer._id));
      return { ...lawyer.toObject(), reviewStatus: lawyer.isPublished && lawyer.pendingProfileChanges ? "pending" : statusOf(lawyer, record), resubmitted: (record?.submissions.length || 0) > 1 };
    }) });
  } catch (error) { console.error("List lawyers error:", error); res.status(500).json({ message: "Failed to list lawyers." }); }
};
export const getPendingLawyers = async (req, res) => {
  try {
    const lawyers = await LawyerProfile.find(realLawyers).populate("userId", "name email role").sort({ updatedAt: -1 });
    const records = await Verification.find({ lawyer: { $in: lawyers.map((lawyer) => lawyer._id) } }).select("lawyer status submissions.number");
    const byLawyer = new Map(records.map((record) => [String(record.lawyer), record]));
    const pending = lawyers.filter((lawyer) => {
      const status = statusOf(lawyer, byLawyer.get(String(lawyer._id)));
      return status === "pending" || (lawyer.isPublished && lawyer.pendingProfileChanges);
    }).map((lawyer) => ({ ...lawyer.toObject(), resubmitted: (byLawyer.get(String(lawyer._id))?.submissions.length || 0) > 1 }));
    res.json({ count: pending.length, lawyers: pending });
  } catch (error) { console.error("Pending lawyers error:", error); res.status(500).json({ message: "Failed to list pending lawyers." }); }
};
export const decideLawyer = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason = "" } = req.body;
    if (!mongoose.isValidObjectId(id) || !["approved", "rejected", "pending"].includes(decision) || typeof reason !== "string" || reason.length > 2000 || (decision === "rejected" && !reason.trim())) return res.status(400).json({ message: "Invalid decision or reason." });
    const lawyer = await LawyerProfile.findOne({ _id: id, ...realLawyers });
    if (!lawyer) return res.status(404).json({ message: "Lawyer profile not found." });
    const verification = await Verification.findOne({ lawyer: id });
    const legacyApproved = !verification && (lawyer.isPublished || await ActivityLog.exists({ lawyer: id, action: "verification_decision_updated", "previous.status": "approved" }));
    if (decision === "approved" && !verification?.submissions.length && !legacyApproved) return res.status(409).json({ message: "Verification documents are required before approving a new lawyer." });
    const previous = { status: statusOf(lawyer, verification), isPublished: lawyer.isPublished, reason: verification?.reason || lawyer.rejectionReason || "", pendingProfileChanges: lawyer.pendingProfileChanges || null };
    const profileUpdate = Boolean(lawyer.isPublished && lawyer.pendingProfileChanges);
    if (profileUpdate) {
      if (decision === "approved") {
        applyPendingProfileChanges(lawyer);
        lawyer.verifiedAt = new Date(); lawyer.verifiedBy = req.user.userId;
      } else if (decision === "rejected") {
        lawyer.pendingProfileChanges = null;
        lawyer.pendingProfileChangesSubmittedAt = null;
        lawyer.profileUpdateRejectionReason = reason.trim();
      }
      // A pending material update never removes an already approved public profile.
    } else {
      lawyer.isPublished = decision === "approved";
      lawyer.rejectionReason = decision === "rejected" ? reason.trim() : null;
      lawyer.verifiedAt = decision === "approved" ? new Date() : null;
      lawyer.verifiedBy = decision === "approved" ? req.user.userId : null;
      if (verification) {
        verification.status = decision;
        verification.reason = decision === "rejected" ? reason.trim() : "";
        verification.reviewedBy = req.user.userId;
        verification.reviewedAt = new Date();
        await verification.save();
      }
    }
    await lawyer.save();
    await recordAction(req, lawyer._id, "verification_decision_updated", previous, { status: profileUpdate ? "approved" : decision, isPublished: lawyer.isPublished, reason: reason.trim(), pendingProfileChanges: lawyer.pendingProfileChanges || null }, reason.trim());
    res.json({ message: profileUpdate ? "Profile update reviewed." : "Decision saved.", lawyer });
  } catch (error) { console.error("Decision error:", error); res.status(500).json({ message: "Failed to save decision." }); }
};
export const approveLawyer = (req, res) => decideLawyer({ ...req, body: { decision: "approved" } }, res);
export const rejectLawyer = (req, res) => decideLawyer({ ...req, body: { decision: "rejected", reason: req.body.reason } }, res);
export const getLawyerActivity = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid lawyer ID." });
  res.json({ entries: await ActivityLog.find({ lawyer: req.params.id }).sort({ createdAt: -1 }).limit(100) });
};
export const getAdminActivity = async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  res.json({ entries: await ActivityLog.find({ actorRole: "admin" }).sort({ createdAt: -1 }).skip((page - 1) * 50).limit(50), page });
};
export const createAdmin = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !EMAIL_PATTERN.test(email) || password.length < 8) return res.status(400).json({ message: "Provide a name, valid email and password of at least 8 characters." });
    if (await User.exists({ email })) return res.status(409).json({ message: "An account with this email already exists." });
    const admin = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: "admin" });
    await recordAction(req, null, "admin_created", null, { adminId: admin._id, name, email });
    res.status(201).json({ message: "Admin account created successfully.", admin: { id: admin._id, name, email, role: "admin" } });
  } catch (error) { if (error?.code === 11000) return res.status(409).json({ message: "An account with this email already exists." }); console.error("Create admin error:", error); res.status(500).json({ message: "Failed to create admin account." }); }
};
export const getRegisteredClients = async (req, res) => {
  try { const clients = await User.find({ role: "client" }).select("_id name email createdAt updatedAt").sort({ createdAt: -1 }).lean(); res.json({ count: clients.length, clients }); }
  catch (error) { console.error("List clients error:", error); res.status(500).json({ message: "Failed to list clients." }); }
};
export const getRegisteredAdmins = async (req, res) => {
  try { const admins = await User.find({ role: "admin" }).select("_id name email createdAt").sort({ createdAt: -1 }).lean(); res.json({ count: admins.length, admins }); }
  catch (error) { console.error("List admins error:", error); res.status(500).json({ message: "Failed to list admins." }); }
};
