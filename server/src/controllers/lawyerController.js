import mongoose from "mongoose";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import Verification from "../models/Verification.js";
import { normalizeSriLankanPhone, isPhoneInUse, isPhoneDuplicateError } from "../services/lawyerPhone.js";

import LawyerProfile from "../models/LawyerProfile.js";
import {
  SearchValidationError,
  searchPublicLawyers,
} from "../services/lawyerSearchService.js";
import {
  findPublicLawyerById,
  findPublicLawyersByIds,
} from "../services/publicLawyerService.js";
import { getActiveLocation } from "../services/searchMetadataService.js";
import {
  ProfileValidationError,
  parseYearsOfPractice,
  resolveControlledLocation,
  resolveControlledPracticeAreas,
  validateConsultationModes,
  validateLanguages,
} from "../services/lawyerProfileValidationService.js";
import {
  buildPendingProfileChanges,
  splitProfileUpdates,
} from "../services/lawyerProfileReviewService.js";
import {
  shouldRequeueVerificationAfterProfileEdit,
} from "../services/verificationWorkflowService.js";

const MAX_BATCH_LAWYERS = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanStringArray(values = []) {
  if (!Array.isArray(values)) {
    throw new ProfileValidationError("Sub areas must be provided as a list.");
  }

  return [
    ...new Set(
      values
        .map((value) => String(value).trim())
        .filter(Boolean)
    ),
  ];
}

async function getLocationIdForCity(city) {
  if (!city) {
    return "";
  }

  const location = await getActiveLocation({ city });
  return location ? String(location._id) : "";
}

async function getSelectableLocationId(locationId, city) {
  if (locationId) {
    const location = await getActiveLocation({ locationId });
    if (location) return String(location._id);
  }

  return getLocationIdForCity(city);
}

// GET LOGGED-IN LAWYER'S PROFILE
export const getMyLawyerProfile = async (req, res) => {
  try {
    const profile = await LawyerProfile.findOne({
      userId: req.user.userId,
      isDemo: { $ne: true },
    })
      .populate("userId", "name email role")
      .lean();

    if (!profile) {
      return res.status(404).json({
        message: "Lawyer profile not found.",
      });
    }

    const [locationId, pendingLocationId] = await Promise.all([
      getSelectableLocationId(profile.locationId, profile.officeCity),
      getSelectableLocationId(
        profile.pendingProfileChanges?.locationId,
        profile.pendingProfileChanges?.officeCity
      ),
    ]);

    return res.json({
      profile: {
        ...profile,
        locationId,
        pendingProfileChanges: profile.pendingProfileChanges
          ? {
              ...profile.pendingProfileChanges,
              locationId: pendingLocationId,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get lawyer profile error:", error);

    return res.status(500).json({
      message: "Failed to get lawyer profile.",
    });
  }
};

// UPDATE LOGGED-IN LAWYER'S PROFILE
export const updateMyLawyerProfile = async (req, res) => {
  try {
    const profile = await LawyerProfile.findOne({
      userId: req.user.userId,
      isDemo: { $ne: true },
    });

    if (!profile) {
      return res.status(404).json({
        message: "Lawyer profile not found.",
      });
    }

    const validatedUpdates = {};

    for (const field of [
      "displayName",
      "professionalTitle",
      "email",
      "phone",
      "description",
    ]) {
      if (req.body[field] !== undefined) {
        validatedUpdates[field] = String(req.body[field]).trim();
      }
    }

    if (
      validatedUpdates.displayName !== undefined &&
      !validatedUpdates.displayName
    ) {
      return res.status(400).json({
        message: "Display name cannot be empty.",
      });
    }

    if (
      validatedUpdates.professionalTitle !== undefined &&
      !validatedUpdates.professionalTitle
    ) {
      return res.status(400).json({
        message: "Professional title cannot be empty.",
      });
    }

    if (
      validatedUpdates.email !== undefined &&
      (!validatedUpdates.email || !EMAIL_PATTERN.test(validatedUpdates.email))
    ) {
      return res.status(400).json({
        message: "Please provide a valid public contact email address.",
      });
    }

    if (req.body.acceptingNewClients !== undefined) {
      if (typeof req.body.acceptingNewClients !== "boolean") {
        return res.status(400).json({
          message: "acceptingNewClients must be true or false.",
        });
      }
      validatedUpdates.acceptingNewClients = req.body.acceptingNewClients;
    }

    if (req.body.yearsOfPractice !== undefined) {
      validatedUpdates.yearsOfPractice = parseYearsOfPractice(
        req.body.yearsOfPractice
      );
    }

    if (req.body.languages !== undefined) {
      validatedUpdates.languages = validateLanguages(req.body.languages);
    }

    if (req.body.consultationModes !== undefined) {
      validatedUpdates.consultationModes = validateConsultationModes(
        req.body.consultationModes
      );
    }

    if (req.body.subAreas !== undefined) {
      validatedUpdates.subAreas = cleanStringArray(req.body.subAreas);
    }

    if (
      req.body.locationId !== undefined ||
      req.body.officeCity !== undefined
    ) {
      const location = await resolveControlledLocation({
        locationId: req.body.locationId,
        officeCity: req.body.officeCity,
      });

      validatedUpdates.locationId = location._id;
      validatedUpdates.officeCity = location.city;
      validatedUpdates.district = location.district;
      validatedUpdates.province = location.province;
    }

    if (
      req.body.primaryPracticeArea !== undefined ||
      req.body.practiceAreas !== undefined
    ) {
      const practiceAreaData = await resolveControlledPracticeAreas({
        primaryPracticeArea:
          req.body.primaryPracticeArea ?? profile.primaryPracticeArea,
        practiceAreas: req.body.practiceAreas ?? profile.practiceAreas,
      });

      validatedUpdates.primaryPracticeArea =
        practiceAreaData.primaryPracticeArea;
      validatedUpdates.practiceAreas = practiceAreaData.practiceAreas;
    }

    if (validatedUpdates.phone !== undefined) {
      const normalized = normalizeSriLankanPhone(validatedUpdates.phone);
      if (!normalized) return res.status(400).json({ message: "Enter a valid Sri Lankan phone number." });
      if (await isPhoneInUse(normalized, profile._id)) return res.status(409).json({ message: "This phone number is already registered." });
      profile.normalizedPhone = normalized;
    }
    const previous = Object.fromEntries(Object.keys(validatedUpdates).map((field) => [field, profile.pendingProfileChanges?.[field] ?? profile[field]]));
    const wasRejected = Boolean(profile.rejectionReason);
    const { immediate, review } = splitProfileUpdates(validatedUpdates);

    if (profile.isPublished) {
      // Low-risk operational details can be reflected immediately. Material
      // professional claims stay pending so the currently approved public
      // profile remains unchanged until an administrator reviews them.
      Object.assign(profile, immediate);

      const pendingChanges = buildPendingProfileChanges(profile, review);
      profile.pendingProfileChanges = pendingChanges;

      if (pendingChanges) {
        profile.pendingProfileChangesSubmittedAt = new Date();
        profile.profileUpdateRejectionReason = null;
      } else {
        profile.pendingProfileChangesSubmittedAt = null;
      }

      await profile.save();
      const actor = await User.findById(req.user.userId).select("name");
      await ActivityLog.create({ actor: req.user.userId, actorName: actor?.name || "Lawyer", actorRole: "lawyer", lawyer: profile._id, action: "profile_updated", previous, next: validatedUpdates });

      const [locationId, pendingLocationId] = await Promise.all([
        getSelectableLocationId(profile.locationId, profile.officeCity),
        getSelectableLocationId(
          profile.pendingProfileChanges?.locationId,
          profile.pendingProfileChanges?.officeCity
        ),
      ]);

      return res.json({
        message: pendingChanges
          ? "Your immediate changes were saved. Professional changes were submitted for review while your approved public profile remains active."
          : "Lawyer profile updated successfully.",
        reviewRequired: Boolean(pendingChanges),
        profile: {
          ...profile.toObject(),
          locationId,
          pendingProfileChanges: profile.pendingProfileChanges
            ? {
                ...profile.pendingProfileChanges,
                locationId: pendingLocationId,
              }
            : null,
        },
      });
    }

    // New or previously rejected lawyers are not public yet, so all validated
    // changes can be written directly to the application being reviewed.
    Object.assign(profile, validatedUpdates);
    profile.pendingProfileChanges = null;
    profile.pendingProfileChangesSubmittedAt = null;
    profile.profileUpdateRejectionReason = null;

    let rejectedVerification = null;
    let requeuedFromProfileEdit = false;
    let requiresDocumentResubmission = false;

    if (wasRejected) {
      rejectedVerification = await Verification.findOne({
        lawyer: profile._id,
        status: "rejected",
      });

      requeuedFromProfileEdit = rejectedVerification
        ? shouldRequeueVerificationAfterProfileEdit(rejectedVerification)
        : true;
      requiresDocumentResubmission = Boolean(
        rejectedVerification && !requeuedFromProfileEdit
      );

      profile.isPublished = false;
      profile.verifiedAt = null;
      profile.verifiedBy = null;

      // Profile-only corrections can be returned to the admin queue as soon as
      // the lawyer fixes the profile. Document/both rejections remain rejected
      // until corrected verification files are explicitly resubmitted.
      if (requeuedFromProfileEdit) {
        profile.rejectionReason = null;
      }
    }

    const actor = await User.findById(req.user.userId).select("name").lean();

    if (requeuedFromProfileEdit && rejectedVerification) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          profile.$session(session);
          rejectedVerification.$session(session);

          rejectedVerification.status = "pending";
          rejectedVerification.reason = "";
          rejectedVerification.rejectionScope = undefined;
          rejectedVerification.reviewedBy = undefined;
          rejectedVerification.reviewedAt = undefined;

          await rejectedVerification.save({ session });
          await profile.save({ session });
          await ActivityLog.create(
            [
              {
                actor: req.user.userId,
                actorName: actor?.name || "Lawyer",
                actorRole: "lawyer",
                lawyer: profile._id,
                action: "profile_updated",
                previous,
                next: validatedUpdates,
              },
            ],
            { session }
          );
        });
      } finally {
        await session.endSession();
      }
    } else {
      await profile.save();
      await ActivityLog.create({
        actor: req.user.userId,
        actorName: actor?.name || "Lawyer",
        actorRole: "lawyer",
        lawyer: profile._id,
        action: "profile_updated",
        previous,
        next: validatedUpdates,
      });
    }

    const locationId = await getSelectableLocationId(
      profile.locationId,
      profile.officeCity
    );

    let message = "Lawyer profile updated successfully.";

    if (requeuedFromProfileEdit) {
      message = "Lawyer profile updated and returned to the admin review queue.";
    } else if (requiresDocumentResubmission) {
      message =
        "Lawyer profile updated. Your verification documents still require changes, so please resubmit them from the verification page.";
    }

    return res.json({
      message,
      reviewRequired: true,
      verificationActionRequired: requiresDocumentResubmission,
      profile: {
        ...profile.toObject(),
        locationId,
      },
    });
  } catch (error) {
    if (isPhoneDuplicateError(error)) return res.status(409).json({ message: "This phone number is already registered." });
    if (error instanceof ProfileValidationError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error("Update lawyer profile error:", error);

    return res.status(500).json({
      message: "Failed to update lawyer profile.",
    });
  }
};

export const getPublicLawyers = async (req, res) => {
  try {
    const {
      practiceArea,
      province,
      district,
      locationId,
      city,
      language,
      consultationMode,
      minExperience,
      acceptingNewClients,
      page = "1",
      limit = "10",
    } = req.query;

    let parsedExperience;

    if (minExperience !== undefined) {
      parsedExperience = Number(minExperience);

      if (Number.isNaN(parsedExperience) || parsedExperience < 0) {
        return res.status(400).json({
          message: "minExperience must be a valid non-negative number.",
        });
      }
    }

    let parsedAcceptingNewClients;

    if (acceptingNewClients !== undefined) {
      if (
        acceptingNewClients !== "true" &&
        acceptingNewClients !== "false"
      ) {
        return res.status(400).json({
          message: "acceptingNewClients must be either true or false.",
        });
      }

      parsedAcceptingNewClients = acceptingNewClients === "true";
    }

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        message: "page must be a positive whole number.",
      });
    }

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 50
    ) {
      return res.status(400).json({
        message: "limit must be a whole number between 1 and 50.",
      });
    }

    const result = await searchPublicLawyers({
      practiceArea,
      province,
      district,
      locationId,
      city,
      language,
      consultationMode,
      minExperience: parsedExperience,
      acceptingNewClients: parsedAcceptingNewClients,
      page: parsedPage,
      limit: parsedLimit,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof SearchValidationError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error("Get public lawyers error:", error);

    return res.status(500).json({
      message: "Failed to fetch lawyers.",
    });
  }
};

export const getPublicLawyersByIds = async (req, res) => {
  try {
    const { lawyerIds = [] } = req.body;

    if (!Array.isArray(lawyerIds)) {
      return res.status(400).json({
        message: "lawyerIds must be an array.",
      });
    }

    if (lawyerIds.length > MAX_BATCH_LAWYERS) {
      return res.status(400).json({
        message: `A maximum of ${MAX_BATCH_LAWYERS} lawyer profiles can be loaded at once.`,
      });
    }

    const lawyers = await findPublicLawyersByIds(lawyerIds);

    return res.json({
      count: lawyers.length,
      lawyers,
    });
  } catch (error) {
    console.error("Get public lawyers by IDs error:", error);

    return res.status(500).json({
      message: "Failed to fetch saved lawyer profiles.",
    });
  }
};

export const getPublicLawyerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid lawyer ID.",
      });
    }

    const lawyer = await findPublicLawyerById(id);

    if (!lawyer) {
      return res.status(404).json({
        message: "Lawyer not found.",
      });
    }

    return res.json({
      lawyer,
    });
  } catch (error) {
    console.error("Get public lawyer error:", error);

    return res.status(500).json({
      message: "Failed to fetch lawyer.",
    });
  }
};
