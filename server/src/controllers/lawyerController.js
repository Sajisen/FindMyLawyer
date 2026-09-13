import LawyerProfile from "../models/LawyerProfile.js";
import mongoose from "mongoose";

import {
  SearchValidationError,
  searchPublicLawyers,
} from "../services/lawyerSearchService.js";

const PUBLIC_LAWYER_FIELDS = [
  "displayName",
  "professionalTitle",
  "email",
  "phone",

  "officeCity",
  "district",
  "province",

  "primaryPracticeArea",
  "practiceAreas",
  "subAreas",

  "languages",
  "consultationModes",

  "yearsOfPractice",
  "description",
  "acceptingNewClients",
].join(" ");

// GET LOGGED-IN LAWYER'S PROFILE
export const getMyLawyerProfile = async (req, res) => {
  try {
    const profile = await LawyerProfile.findOne({
      userId: req.user.userId,
      isDemo: { $ne: true },
    }).populate("userId", "name email role");

    if (!profile) {
      return res.status(404).json({
        message: "Lawyer profile not found.",
      });
    }

    return res.json({
      profile,
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

    // Only fields that a lawyer is allowed to edit
    const allowedFields = [
      "displayName",
      "professionalTitle",
      "phone",
      "province",
      "district",
      "officeCity",
      "primaryPracticeArea",
      "practiceAreas",
      "subAreas",
      "languages",
      "consultationModes",
      "yearsOfPractice",
      "description",
      "acceptingNewClients",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();

    return res.json({
      message: "Lawyer profile updated successfully.",
      profile,
    });
  } catch (error) {
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

export const getPublicLawyerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid lawyer ID.",
      });
    }

    const lawyer = await LawyerProfile.findOne({
  _id: id,

  $or: [
    {
      isDemo: true,
      verificationStatus: "demo_verified",
    },
    {
      isDemo: { $ne: true },
      isPublished: true,
    },
  ],
})
  .select(PUBLIC_LAWYER_FIELDS)
  .lean();

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