import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import ActivityLog from "../models/ActivityLog.js";
import LawyerProfile from "../models/LawyerProfile.js";
import User from "../models/User.js";
import Verification from "../models/Verification.js";
import { applyPendingProfileChanges } from "../services/lawyerProfileReviewService.js";
import {
  normalizeVerificationRejectionScope,
  VERIFICATION_REJECTION_SCOPES,
} from "../services/verificationWorkflowService.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const realLawyers = { isDemo: { $ne: true } };

function statusOf(lawyer, record) {
  return (
    record?.status ||
    (lawyer.isPublished
      ? "approved"
      : lawyer.rejectionReason
        ? "rejected"
        : "pending")
  );
}

function reviewStatusOf(lawyer, record) {
  if (lawyer.isPublished && lawyer.pendingProfileChanges) {
    return "pending";
  }

  return statusOf(lawyer, record);
}

function adminLawyerPayload(lawyer, record) {
  return {
    ...lawyer.toObject(),
    reviewStatus: reviewStatusOf(lawyer, record),
    resubmitted: (record?.submissions?.length || 0) > 1,
  };
}

async function actorName(id, session) {
  const query = User.findById(id).select("name");

  if (session) {
    query.session(session);
  }

  const user = await query.lean();
  return user?.name || "Unknown admin";
}

async function recordAction(
  req,
  lawyer,
  action,
  previous,
  next,
  reason = "",
  session
) {
  const entry = {
    actor: req.user.userId,
    actorName: await actorName(req.user.userId, session),
    actorRole: "admin",
    lawyer,
    action,
    previous,
    next,
    reason,
  };

  if (session) {
    const [created] = await ActivityLog.create([entry], { session });
    return created;
  }

  return ActivityLog.create(entry);
}

export const getAllLawyers = async (req, res) => {
  try {
    const lawyers = await LawyerProfile.find(realLawyers)
      .populate("userId", "name email role")
      .sort({ updatedAt: -1 });
    const records = await Verification.find({
      lawyer: { $in: lawyers.map((lawyer) => lawyer._id) },
    }).select("lawyer status submissions.number");
    const byLawyer = new Map(
      records.map((record) => [String(record.lawyer), record])
    );

    return res.json({
      lawyers: lawyers.map((lawyer) =>
        adminLawyerPayload(lawyer, byLawyer.get(String(lawyer._id)))
      ),
    });
  } catch (error) {
    console.error("List lawyers error:", error);
    return res.status(500).json({ message: "Failed to list lawyers." });
  }
};

export const getPendingLawyers = async (req, res) => {
  try {
    const lawyers = await LawyerProfile.find(realLawyers)
      .populate("userId", "name email role")
      .sort({ updatedAt: -1 });
    const records = await Verification.find({
      lawyer: { $in: lawyers.map((lawyer) => lawyer._id) },
    }).select("lawyer status submissions.number");
    const byLawyer = new Map(
      records.map((record) => [String(record.lawyer), record])
    );

    const pending = lawyers
      .filter(
        (lawyer) =>
          reviewStatusOf(lawyer, byLawyer.get(String(lawyer._id))) ===
          "pending"
      )
      .map((lawyer) =>
        adminLawyerPayload(lawyer, byLawyer.get(String(lawyer._id)))
      );

    return res.json({ count: pending.length, lawyers: pending });
  } catch (error) {
    console.error("Pending lawyers error:", error);
    return res.status(500).json({
      message: "Failed to list pending lawyers.",
    });
  }
};

export const decideLawyer = async (req, res) => {
  const { id } = req.params;
  const { decision, reason = "", rejectionScope } = req.body || {};
  const cleanReason = typeof reason === "string" ? reason.trim() : "";
  const decisionReason = decision === "rejected" ? cleanReason : "";

  if (
    !mongoose.isValidObjectId(id) ||
    !["approved", "rejected", "pending"].includes(decision) ||
    typeof reason !== "string" ||
    reason.length > 2000 ||
    (decision === "rejected" && !cleanReason) ||
    (rejectionScope !== undefined &&
      !VERIFICATION_REJECTION_SCOPES.includes(rejectionScope))
  ) {
    return res.status(400).json({ message: "Invalid decision or reason." });
  }

  let session;
  let responsePayload;

  try {
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const lawyer = await LawyerProfile.findOne({
        _id: id,
        ...realLawyers,
      }).session(session);

      if (!lawyer) {
        const error = new Error("LAWYER_NOT_FOUND");
        error.statusCode = 404;
        throw error;
      }

      let verification = await Verification.findOne({ lawyer: id }).session(
        session
      );
      const legacyApproved =
        !verification &&
        (lawyer.isPublished ||
          Boolean(
            await ActivityLog.exists({
              lawyer: id,
              action: "verification_decision_updated",
              "previous.status": "approved",
            }).session(session)
          ));

      if (
        decision === "approved" &&
        !verification?.submissions.length &&
        !legacyApproved
      ) {
        const error = new Error("DOCUMENTS_REQUIRED");
        error.statusCode = 409;
        throw error;
      }

      const currentReviewStatus = reviewStatusOf(lawyer, verification);

      // "Pending" is a no-op choice for items that are already awaiting
      // review. Do not let a stale/legacy client use it to silently unpublish
      // an approved lawyer or erase a rejected state.
      if (decision === "pending" && currentReviewStatus !== "pending") {
        const error = new Error("INVALID_PENDING_TRANSITION");
        error.statusCode = 409;
        throw error;
      }

      const previous = {
        status: statusOf(lawyer, verification),
        isPublished: lawyer.isPublished,
        reason: verification?.reason || lawyer.rejectionReason || "",
        rejectionScope: verification?.rejectionScope || null,
        pendingProfileChanges: lawyer.pendingProfileChanges || null,
      };
      const profileUpdate = Boolean(
        lawyer.isPublished && lawyer.pendingProfileChanges
      );

      // A rejected unpublished application needs a Verification record even if
      // the lawyer has not uploaded documents yet. This preserves the reason
      // and rejection scope so profile edits cannot accidentally bypass a
      // document-resubmission requirement.
      if (!profileUpdate && decision === "rejected" && !verification) {
        verification = new Verification({ lawyer: id });
        verification.$session(session);
      }

      if (profileUpdate) {
        if (decision === "approved") {
          applyPendingProfileChanges(lawyer);
          lawyer.verifiedAt = new Date();
          lawyer.verifiedBy = req.user.userId;
        } else if (decision === "rejected") {
          lawyer.pendingProfileChanges = null;
          lawyer.pendingProfileChangesSubmittedAt = null;
          lawyer.profileUpdateRejectionReason = decisionReason;
        }
        // A pending material update never removes an already-approved public
        // profile and never changes the underlying document-verification state.
      } else {
        const normalizedScope =
          decision === "rejected"
            ? normalizeVerificationRejectionScope(rejectionScope)
            : undefined;

        lawyer.isPublished = decision === "approved";
        lawyer.rejectionReason =
          decision === "rejected" ? decisionReason : null;
        lawyer.verifiedAt = decision === "approved" ? new Date() : null;
        lawyer.verifiedBy =
          decision === "approved" ? req.user.userId : null;

        if (verification) {
          verification.status = decision;
          verification.reason = decision === "rejected" ? decisionReason : "";
          verification.rejectionScope = normalizedScope;
          verification.reviewedBy = req.user.userId;
          verification.reviewedAt = new Date();
          await verification.save({ session });
        }
      }

      await lawyer.save({ session });

      const finalReviewStatus = reviewStatusOf(lawyer, verification);
      await recordAction(
        req,
        lawyer._id,
        "verification_decision_updated",
        previous,
        {
          status: finalReviewStatus,
          decision,
          isPublished: lawyer.isPublished,
          reason: decisionReason,
          rejectionScope:
            !profileUpdate && decision === "rejected"
              ? normalizeVerificationRejectionScope(rejectionScope)
              : verification?.rejectionScope || null,
          pendingProfileChanges: lawyer.pendingProfileChanges || null,
        },
        decisionReason,
        session
      );

      responsePayload = {
        message: profileUpdate ? "Profile update reviewed." : "Decision saved.",
        lawyer: adminLawyerPayload(lawyer, verification),
      };
    });

    return res.json(responsePayload);
  } catch (error) {
    if (error.message === "LAWYER_NOT_FOUND") {
      return res.status(404).json({ message: "Lawyer profile not found." });
    }

    if (error.message === "DOCUMENTS_REQUIRED") {
      return res.status(409).json({
        message:
          "Verification documents are required before approving a new lawyer.",
      });
    }

    if (error.message === "INVALID_PENDING_TRANSITION") {
      return res.status(409).json({
        message:
          "Only an application that is already awaiting review can be kept pending.",
      });
    }

    console.error("Decision error:", error);
    return res.status(500).json({ message: "Failed to save decision." });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const approveLawyer = (req, res) => {
  req.body = { ...req.body, decision: "approved" };
  return decideLawyer(req, res);
};

export const rejectLawyer = (req, res) => {
  req.body = { ...req.body, decision: "rejected" };
  return decideLawyer(req, res);
};

export const getLawyerActivity = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid lawyer ID." });
  }

  return res.json({
    entries: await ActivityLog.find({ lawyer: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100),
  });
};

export const getAdminActivity = async (req, res) => {
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(req.query.page, 10) || 1)
  );

  return res.json({
    entries: await ActivityLog.find({ actorRole: "admin" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * 50)
      .limit(50),
    page,
  });
};

export const createAdmin = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !EMAIL_PATTERN.test(email) || password.length < 8) {
      return res.status(400).json({
        message:
          "Provide a name, valid email and password of at least 8 characters.",
      });
    }

    if (await User.exists({ email })) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    const admin = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin",
    });

    await recordAction(req, null, "admin_created", null, {
      adminId: admin._id,
      name,
      email,
    });

    return res.status(201).json({
      message: "Admin account created successfully.",
      admin: { id: admin._id, name, email, role: "admin" },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    console.error("Create admin error:", error);
    return res.status(500).json({ message: "Failed to create admin account." });
  }
};

export const getRegisteredClients = async (req, res) => {
  try {
    const clients = await User.find({ role: "client" })
      .select("_id name email createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ count: clients.length, clients });
  } catch (error) {
    console.error("List clients error:", error);
    return res.status(500).json({ message: "Failed to list clients." });
  }
};

export const getRegisteredAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("_id name email createdAt")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ count: admins.length, admins });
  } catch (error) {
    console.error("List admins error:", error);
    return res.status(500).json({ message: "Failed to list admins." });
  }
};
