import mongoose from "mongoose";

import ActivityLog from "../models/ActivityLog.js";
import LawyerProfile from "../models/LawyerProfile.js";
import User from "../models/User.js";
import Verification from "../models/Verification.js";
import VerificationFile from "../models/VerificationFile.js";
import VerificationViewLog from "../models/VerificationViewLog.js";
import {
  requiresVerificationDocumentResubmission,
} from "../services/verificationWorkflowService.js";

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil((MAX_FILE_BYTES * 4) / 3) + 4;

const slots = {
  certificate: ["application/pdf"],
  nicFront: ["image/jpeg", "image/png"],
  nicBack: ["image/jpeg", "image/png"],
  passport: ["image/jpeg", "image/png"],
};

function metadata(record) {
  if (!record) {
    return null;
  }

  return {
    _id: record._id,
    status: record.status,
    reason: record.reason,
    rejectionScope: record.rejectionScope,
    reviewedAt: record.reviewedAt,
    reviewedBy: record.reviewedBy,
    submissions: record.submissions.map((item) => ({
      _id: item._id,
      number: item.number,
      identityType: item.identityType,
      enrolmentNumber: item.enrolmentNumber,
      submittedAt: item.submittedAt,
      files: item.files.map((file) => ({
        _id: file._id,
        slot: file.slot,
        name: file.name,
        mimeType: file.mimeType,
      })),
    })),
  };
}

function hasExpectedMagicBytes(data, mimeType) {
  if (mimeType === "application/pdf") {
    return data.subarray(0, 5).toString() === "%PDF-";
  }

  if (mimeType === "image/png") {
    return data
      .subarray(0, 8)
      .equals(Buffer.from("89504e470d0a1a0a", "hex"));
  }

  return data.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"));
}

function prepareFiles(files, identityType) {
  if (!Array.isArray(files)) {
    throw new Error("INVALID_FILES");
  }

  const required =
    identityType === "nic"
      ? ["certificate", "nicFront", "nicBack"]
      : ["certificate", "passport"];

  const uniqueSlots = new Set(files.map((file) => file?.slot));

  if (
    files.length !== required.length ||
    uniqueSlots.size !== required.length ||
    required.some((slot) => !uniqueSlots.has(slot))
  ) {
    throw new Error("MISSING_FILES");
  }

  return files.map((file) => {
    if (
      !file ||
      !slots[file.slot]?.includes(file.mimeType) ||
      typeof file.name !== "string" ||
      !file.name.trim() ||
      file.name.length > 150 ||
      typeof file.data !== "string" ||
      file.data.length > MAX_BASE64_LENGTH ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(file.data)
    ) {
      throw new Error("INVALID_FILE");
    }

    const data = Buffer.from(file.data, "base64");

    if (
      !data.length ||
      data.length > MAX_FILE_BYTES ||
      !hasExpectedMagicBytes(data, file.mimeType)
    ) {
      throw new Error("INVALID_FILE_CONTENT");
    }

    return {
      slot: file.slot,
      mimeType: file.mimeType,
      name: file.name.trim(),
      data,
    };
  });
}

export const getMine = async (req, res) => {
  try {
    const profile = await LawyerProfile.findOne({
      userId: req.user.userId,
      isDemo: { $ne: true },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    const record = await Verification.findOne({ lawyer: profile._id });
    return res.json({ verification: metadata(record) });
  } catch (error) {
    console.error("Get verification error:", error);
    return res.status(500).json({ message: "Failed to load verification." });
  }
};

export const submit = async (req, res) => {
  const { identityType, enrolmentNumber, files } = req.body || {};

  if (
    !["nic", "passport"].includes(identityType) ||
    typeof enrolmentNumber !== "string" ||
    !enrolmentNumber.trim() ||
    enrolmentNumber.trim().length > 100
  ) {
    return res.status(400).json({ message: "Invalid verification details." });
  }

  let prepared;

  try {
    prepared = prepareFiles(files, identityType);
  } catch (error) {
    const messages = {
      INVALID_FILES: "Invalid verification documents.",
      MISSING_FILES:
        "Provide the enrolment certificate and all required identity documents.",
      INVALID_FILE: "One or more verification documents are invalid.",
      INVALID_FILE_CONTENT:
        "Document contents do not match the selected file type or exceed 3 MB.",
    };

    return res.status(400).json({
      message: messages[error.message] || "Invalid verification documents.",
    });
  }

  let session;
  let responseRecord;

  try {
    const actor = await User.findById(req.user.userId).select("name").lean();
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const profile = await LawyerProfile.findOne({
        userId: req.user.userId,
        isDemo: { $ne: true },
      }).session(session);

      if (!profile) {
        const error = new Error("PROFILE_NOT_FOUND");
        error.statusCode = 404;
        throw error;
      }

      const current = await Verification.findOne({
        lawyer: profile._id,
      }).session(session);

      if (current && current.status !== "rejected") {
        const error = new Error("NOT_RESUBMITTABLE");
        error.statusCode = 409;
        throw error;
      }

      if (current && !requiresVerificationDocumentResubmission(current)) {
        const error = new Error("PROFILE_ONLY_REJECTION");
        error.statusCode = 409;
        throw error;
      }

      const record = current || new Verification({ lawyer: profile._id });
      record.$session(session);

      const submissionId = new mongoose.Types.ObjectId();
      const stored = await VerificationFile.insertMany(
        prepared.map((file) => ({
          ...file,
          lawyer: profile._id,
          submission: submissionId,
        })),
        { session }
      );

      record.submissions.push({
        _id: submissionId,
        number: record.submissions.length + 1,
        identityType,
        enrolmentNumber: enrolmentNumber.trim(),
        files: stored.map((file) => ({
          _id: file._id,
          slot: file.slot,
          name: file.name,
          mimeType: file.mimeType,
        })),
      });

      const previous = {
        status: current?.status || "unsubmitted",
        reason: current?.reason || "",
        rejectionScope: current?.rejectionScope || null,
      };

      record.status = "pending";
      record.reason = "";
      record.rejectionScope = undefined;
      record.reviewedBy = undefined;
      record.reviewedAt = undefined;

      profile.isPublished = false;
      profile.rejectionReason = null;
      profile.verifiedAt = null;
      profile.verifiedBy = null;

      await record.save({ session });
      await profile.save({ session });
      await ActivityLog.create(
        [
          {
            actor: req.user.userId,
            actorName: actor?.name || "Lawyer",
            actorRole: "lawyer",
            lawyer: profile._id,
            action: current
              ? "verification_resubmitted"
              : "verification_submitted",
            previous,
            next: {
              status: "pending",
              submission: record.submissions.length,
            },
          },
        ],
        { session }
      );

      responseRecord = metadata(record);
    });

    return res.status(201).json({ verification: responseRecord });
  } catch (error) {
    if (error.statusCode === 404 || error.message === "PROFILE_NOT_FOUND") {
      return res.status(404).json({ message: "Profile not found." });
    }

    if (error.message === "PROFILE_ONLY_REJECTION") {
      return res.status(409).json({
        message:
          "The requested correction is to your lawyer profile. Update the profile instead of uploading the same verification documents again.",
      });
    }

    if (error.statusCode === 409 || error.message === "NOT_RESUBMITTABLE") {
      return res
        .status(409)
        .json({ message: "Only rejected submissions may be resubmitted." });
    }

    console.error("Submit verification error:", error);
    return res.status(500).json({
      message: "Failed to submit verification documents.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const viewFile = async (req, res) => {
  try {
    const { lawyerId, submissionId, fileId } = req.params;

    if (
      ![lawyerId, submissionId, fileId].every((value) =>
        mongoose.isValidObjectId(value)
      )
    ) {
      return res.status(400).json({ message: "Invalid document ID." });
    }

    const profile = await LawyerProfile.findById(lawyerId).select("userId");

    if (
      !profile ||
      (req.user.role !== "admin" &&
        String(profile.userId) !== String(req.user.userId))
    ) {
      return res.status(404).json({ message: "Document not found." });
    }

    const record = await Verification.findOne({ lawyer: lawyerId });
    const submission = record?.submissions.id(submissionId);
    const fileReference = submission?.files.id(fileId);

    if (!fileReference) {
      return res.status(404).json({ message: "Document not found." });
    }

    const file = await VerificationFile.findOne({
      _id: fileId,
      lawyer: lawyerId,
      submission: submissionId,
    }).select("+data");

    if (!file) {
      return res.status(404).json({ message: "Document not found." });
    }

    // Verification identity documents are sensitive. Fail closed if the audit
    // record cannot be written so document access is never silently unlogged.
    await VerificationViewLog.create({
      actorId: req.user.userId,
      actorRole: req.user.role,
      lawyerId,
      submissionId,
      fileId,
      documentType: fileReference.slot,
    });

    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": "inline",
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    });

    return res.send(file.data);
  } catch (error) {
    console.error("View verification file error:", error);
    return res.status(500).json({
      message: "Could not open the verification document.",
    });
  }
};

export const getLawyerVerification = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid lawyer ID." });
    }

    const record = await Verification.findOne({ lawyer: req.params.id });
    return res.json({ verification: metadata(record) });
  } catch (error) {
    console.error("Get lawyer verification error:", error);
    return res.status(500).json({ message: "Failed to load verification." });
  }
};
