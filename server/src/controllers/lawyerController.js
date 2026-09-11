import LawyerProfile from "../models/LawyerProfile.js";
import mongoose from "mongoose";

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
      city,
      language,
      consultationMode,
      minExperience,
      acceptingNewClients,
    } = req.query;

    const conditions = [];

    // PUBLIC VISIBILITY RULE
    conditions.push({
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
    });

    // PRACTICE AREA
    if (practiceArea) {
      conditions.push({
        $or: [
          { primaryPracticeArea: practiceArea },
          { practiceAreas: practiceArea },
        ],
      });
    }

    // LOCATION
    if (province) {
      conditions.push({
        province,
      });
    }

    if (district) {
      conditions.push({
        district,
      });
    }

    if (city) {
      conditions.push({
        officeCity: city,
      });
    }

    // LANGUAGE
    if (language) {
      conditions.push({
        languages: language,
      });
    }

    // CONSULTATION MODE
    if (consultationMode) {
      conditions.push({
        consultationModes: consultationMode,
      });
    }

    // EXPERIENCE
    if (minExperience !== undefined) {
      const experience = Number(minExperience);

      if (Number.isNaN(experience) || experience < 0) {
        return res.status(400).json({
          message: "minExperience must be a valid positive number.",
        });
      }

      conditions.push({
        yearsOfPractice: {
          $gte: experience,
        },
      });
    }

    // ACCEPTING NEW CLIENTS
    if (acceptingNewClients !== undefined) {
      if (
        acceptingNewClients !== "true" &&
        acceptingNewClients !== "false"
      ) {
        return res.status(400).json({
          message:
            "acceptingNewClients must be either true or false.",
        });
      }

      conditions.push({
        acceptingNewClients:
          acceptingNewClients === "true",
      });
    }

    const lawyers = await LawyerProfile.find({
  $and: conditions,
})
  .select(PUBLIC_LAWYER_FIELDS)
  .sort({
    yearsOfPractice: -1,
    displayName: 1,
  })
  .lean();

    return res.json({
      count: lawyers.length,
      lawyers,
    });
  } catch (error) {
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