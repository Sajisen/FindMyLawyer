import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import LawyerProfile from "../models/LawyerProfile.js";
import User from "../models/User.js";

// GET ALL LAWYERS WAITING FOR ADMIN APPROVAL
export const getPendingLawyers = async (req, res) => {
  try {
    const lawyers = await LawyerProfile.find({
      isDemo: { $ne: true },
      isPublished: false,
      $or: [
        { rejectionReason: null },
        { rejectionReason: { $exists: false } },
      ],
    })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

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


// APPROVE LAWYER
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

    lawyer.isPublished = true;
    lawyer.rejectionReason = null;
    lawyer.verifiedAt = new Date();
    lawyer.verifiedBy = req.user.userId;

    await lawyer.save();

    return res.json({
      message: "Lawyer approved and published successfully.",
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


// REJECT LAWYER
export const rejectLawyer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid lawyer ID.",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: "A rejection reason is required.",
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

    lawyer.isPublished = false;
    lawyer.rejectionReason = reason.trim();
    lawyer.verifiedAt = null;
    lawyer.verifiedBy = null;

    await lawyer.save();

    return res.json({
      message: "Lawyer application rejected.",
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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
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