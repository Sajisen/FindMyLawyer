import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import LawyerProfile from "../models/LawyerProfile.js";
import { normalizeSriLankanPhone, isPhoneInUse, isPhoneDuplicateError } from "../services/lawyerPhone.js";
import {
  ProfileValidationError,
  parseYearsOfPractice,
  resolveControlledLocation,
  resolveControlledPracticeAreas,
  validateConsultationModes,
  validateLanguages,
} from "../services/lawyerProfileValidationService.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function cleanStringArray(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((value) => String(value).trim())
        .filter(Boolean)
    ),
  ];
}

// CLIENT REGISTRATION
export const registerClient = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
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
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "client",
    });
    const token = createToken(user);

    return res.status(201).json({
      message: "Client account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Client registration error:", error);
    return res.status(500).json({
      message: "Failed to create client account.",
    });
  }
};

// LAWYER REGISTRATION
export const registerLawyer = async (req, res) => {
  let createdUser = null;

  try {
    const {
      locationId,
      officeCity,
      primaryPracticeArea,
      practiceAreas,
      subAreas,
      languages,
      consultationModes,
      yearsOfPractice,
      description,
      acceptingNewClients,
    } = req.body;

    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const displayName = String(req.body.displayName || "").trim();
    const professionalTitle = String(req.body.professionalTitle || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password ||
      !displayName ||
      !professionalTitle ||
      !phone ||
      !primaryPracticeArea ||
      (!locationId && !officeCity)
    ) {
      return res.status(400).json({
        message: "Please provide all required lawyer registration fields.",
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

    const normalizedPhone = normalizeSriLankanPhone(phone);
    if (!normalizedPhone) return res.status(400).json({ message: "Enter a valid Sri Lankan phone number." });
    if (await isPhoneInUse(normalizedPhone)) return res.status(409).json({ message: "This phone number is already registered." });

    const [location, practiceAreaData] = await Promise.all([
      resolveControlledLocation({ locationId, officeCity }),
      resolveControlledPracticeAreas({
        primaryPracticeArea,
        practiceAreas,
      }),
    ]);

    const validatedLanguages = validateLanguages(languages || []);
    const validatedConsultationModes = validateConsultationModes(
      consultationModes || []
    );
    const parsedExperience = parseYearsOfPractice(yearsOfPractice);

    if (
      acceptingNewClients !== undefined &&
      typeof acceptingNewClients !== "boolean"
    ) {
      return res.status(400).json({
        message: "acceptingNewClients must be true or false.",
      });
    }

    const existingUser = await User.findOne({ email }).select("_id").lean();

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    createdUser = await User.create({
      name,
      email,
      passwordHash,
      role: "lawyer",
    });

    const lawyerProfile = await LawyerProfile.create({
      userId: createdUser._id,
      displayName,
      professionalTitle,
      email,
      phone,
      normalizedPhone,
      locationId: location._id,
      province: location.province,
      district: location.district,
      officeCity: location.city,
      primaryPracticeArea: practiceAreaData.primaryPracticeArea,
      practiceAreas: practiceAreaData.practiceAreas,
      subAreas: cleanStringArray(subAreas),
      languages: validatedLanguages,
      consultationModes: validatedConsultationModes,
      yearsOfPractice: parsedExperience,
      description: String(description || "").trim(),
      acceptingNewClients:
        acceptingNewClients === undefined ? true : acceptingNewClients,
      isDemo: false,
      isPublished: false,
      rejectionReason: null,
      verifiedAt: null,
      verifiedBy: null,
    });

    const token = createToken(createdUser);

    return res.status(201).json({
      message:
        "Lawyer account created successfully. Your profile is awaiting admin approval.",
      token,
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      },
      lawyerProfile: {
        id: lawyerProfile._id,
        displayName: lawyerProfile.displayName,
        isPublished: lawyerProfile.isPublished,
      },
    });
  } catch (error) {
    if (createdUser) {
      try {
        await User.findByIdAndDelete(createdUser._id);
      } catch (cleanupError) {
        console.error("Lawyer registration cleanup error:", cleanupError);
      }
    }

    if (error instanceof ProfileValidationError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    if (isPhoneDuplicateError(error)) return res.status(409).json({ message: "This phone number is already registered." });
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    console.error("Lawyer registration error:", error);
    return res.status(500).json({
      message: "Failed to create lawyer account.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Login failed.",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("_id name email role createdAt updatedAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      message: "Failed to get user.",
    });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();

    if (!name) {
      return res.status(400).json({
        message: "Name is required.",
      });
    }

    if (name.length > 120) {
      return res.status(400).json({
        message: "Name must be 120 characters or fewer.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name },
      { new: true, runValidators: true }
    )
      .select("_id name email role createdAt updatedAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update current user error:", error);
    return res.status(500).json({
      message: "Failed to update profile.",
    });
  }
};
