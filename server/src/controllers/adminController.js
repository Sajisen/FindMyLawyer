import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import LawyerProfile from "../models/LawyerProfile.js";
import User from "../models/User.js";
import { applyPendingProfileChanges } from "../services/lawyerProfileReviewService.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REJECTION_REASON_LENGTH = 2000;

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

// GET NEW LAWYER APPLICATIONS AND APPROVED-PROFILE UPDATE REQUESTS
export const getPendingLawyers = async (req, res) => {
  try {
    const lawyers = await LawyerProfile.find({
      isDemo: { $ne: true },
      $or: [
        {
          isPublished: false,
          $or: [
            { rejectionReason: null },
            { rejectionReason: { $exists: false } },
          ],
        },
        {
          isPublished: true,
          pendingProfileChanges: { $ne: null },
        },
      ],
    })
      .populate("userId", "name email role")
      .sort({ updatedAt: -1 });

    return res.json({
      count: lawyers.length,
      lawyers,
    });
  } catch (error) {
    console.error("Get pending lawyers error:", error);

    return res.status(500).json({
      message: "Failed to get pending lawyers.",
    });
  }
};

// APPROVE A NEW LAWYER OR AN APPROVED LAWYER'S PENDING MATERIAL CHANGES
export const approveLawyer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid lawyer ID.",
      });
    }

    const lawyer = await LawyerProfile.findOne({
      _id: id,
      isDemo: { $ne: true },
    });

    if (!lawyer) {
      return res.status(404).json({
        message: "Lawyer profile not found.",
      });
    }

    const isProfileUpdate = Boolean(
      lawyer.isPublished && lawyer.pendingProfileChanges
    );

    if (isProfileUpdate) {
      const applied = applyPendingProfileChanges(lawyer);

      if (!applied) {
        return res.status(400).json({
          message: "This lawyer has no pending profile changes to approve.",
        });
      }

      lawyer.verifiedAt = new Date();
      lawyer.verifiedBy = req.user.userId;
      await lawyer.save();

      return res.json({
        message: "Lawyer profile update approved successfully.",
        reviewType: "profile_update",
        lawyer: {
          id: lawyer._id,
          displayName: lawyer.displayName,
          isPublished: lawyer.isPublished,
          verifiedAt: lawyer.verifiedAt,
          verifiedBy: lawyer.verifiedBy,
        },
      });
    }

    lawyer.isPublished = true;
    lawyer.rejectionReason = null;
    lawyer.profileUpdateRejectionReason = null;
    lawyer.pendingProfileChanges = null;
    lawyer.pendingProfileChangesSubmittedAt = null;
    lawyer.verifiedAt = new Date();
    lawyer.verifiedBy = req.user.userId;

    await lawyer.save();

    return res.json({
      message: "Lawyer approved and published successfully.",
      reviewType: "new_application",
      lawyer: {
        id: lawyer._id,
        displayName: lawyer.displayName,
        isPublished: lawyer.isPublished,
        verifiedAt: lawyer.verifiedAt,
        verifiedBy: lawyer.verifiedBy,
      },
    });
  } catch (error) {
    console.error("Approve lawyer error:", error);

    return res.status(500).json({
      message: "Failed to approve lawyer.",
    });
  }
};

// REJECT A NEW LAWYER OR A PENDING UPDATE WHILE KEEPING AN APPROVED PROFILE LIVE
export const rejectLawyer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid lawyer ID.",
      });
    }

    const normalizedReason = String(reason || "").trim();

    if (!normalizedReason) {
      return res.status(400).json({
        message: "A rejection reason is required.",
      });
    }

    if (normalizedReason.length > MAX_REJECTION_REASON_LENGTH) {
      return res.status(400).json({
        message: `Rejection reason must be ${MAX_REJECTION_REASON_LENGTH} characters or fewer.`,
      });
    }

    const lawyer = await LawyerProfile.findOne({
      _id: id,
      isDemo: { $ne: true },
    });

    if (!lawyer) {
      return res.status(404).json({
        message: "Lawyer profile not found.",
      });
    }

    const isProfileUpdate = Boolean(
      lawyer.isPublished && lawyer.pendingProfileChanges
    );

    if (isProfileUpdate) {
      lawyer.pendingProfileChanges = null;
      lawyer.pendingProfileChangesSubmittedAt = null;
      lawyer.profileUpdateRejectionReason = normalizedReason;

      // Keep the previously approved profile public and its existing
      // verification metadata intact.
      await lawyer.save();

      return res.json({
        message:
          "Profile update rejected. The lawyer's previously approved public profile remains active.",
        reviewType: "profile_update",
        lawyer: {
          id: lawyer._id,
          displayName: lawyer.displayName,
          isPublished: lawyer.isPublished,
          profileUpdateRejectionReason: lawyer.profileUpdateRejectionReason,
        },
      });
    }

    lawyer.isPublished = false;
    lawyer.rejectionReason = normalizedReason;
    lawyer.verifiedAt = null;
    lawyer.verifiedBy = null;

    await lawyer.save();

    return res.json({
      message: "Lawyer application rejected.",
      reviewType: "new_application",
      lawyer: {
        id: lawyer._id,
        displayName: lawyer.displayName,
        isPublished: lawyer.isPublished,
        rejectionReason: lawyer.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Reject lawyer error:", error);

    return res.status(500).json({
      message: "Failed to reject lawyer.",
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const existingUser = await User.findOne({ email }).select("_id").lean();

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      passwordHash,
      role: "admin",
    });

    return res.status(201).json({
      message: "Admin account created successfully.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Create admin error:", error);

    return res.status(500).json({
      message: "Failed to create admin account.",
    });
  }
};

export const getRegisteredClients = async (req, res) => {
  try {
    const clients = await User.find({
      role: "client",
    })
      .select("_id name email createdAt updatedAt")
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.json({
      count: clients.length,
      clients,
    });
  } catch (error) {
    console.error("Get registered clients error:", error);

    return res.status(500).json({
      message: "Failed to get registered clients.",
    });
  }
};
