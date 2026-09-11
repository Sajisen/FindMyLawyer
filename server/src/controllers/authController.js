import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import LawyerProfile from "../models/LawyerProfile.js";

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// CLIENT REGISTRATION
export const registerClient = async (req, res) => {
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

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
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
      },
    });
  } catch (error) {
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
      name,
      email,
      password,

      displayName,
      professionalTitle,
      phone,

      province,
      district,
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

    if (
      !name ||
      !email ||
      !password ||
      !displayName ||
      !professionalTitle ||
      !phone ||
      !province ||
      !district ||
      !officeCity ||
      !primaryPracticeArea
    ) {
      return res.status(400).json({
        message: "Please provide all required lawyer registration fields.",
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

    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "lawyer",
    });

    const lawyerProfile = await LawyerProfile.create({
      userId: createdUser._id,

      displayName: displayName.trim(),
      professionalTitle: professionalTitle.trim(),

      email: normalizedEmail,
      phone: phone.trim(),

      province: province.trim(),
      district: district.trim(),
      officeCity: officeCity.trim(),

      primaryPracticeArea,

      practiceAreas: Array.isArray(practiceAreas)
        ? practiceAreas
        : [primaryPracticeArea],

      subAreas: Array.isArray(subAreas)
        ? subAreas
        : [],

      languages: Array.isArray(languages)
        ? languages
        : [],

      consultationModes: Array.isArray(consultationModes)
        ? consultationModes
        : [],

      yearsOfPractice:
        yearsOfPractice !== undefined
          ? Number(yearsOfPractice)
          : 0,

      description: description || "",

      acceptingNewClients:
        acceptingNewClients !== undefined
          ? Boolean(acceptingNewClients)
          : true,

      // IMPORTANT
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
      },

      lawyerProfile: {
        id: lawyerProfile._id,
        displayName: lawyerProfile.displayName,
        isPublished: lawyerProfile.isPublished,
      },
    });
  } catch (error) {
    console.error("Lawyer registration error:", error);

    // If User was created but LawyerProfile failed,
    // remove the incomplete User account.
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id);
    }

    return res.status(500).json({
      message: "Failed to create lawyer account.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

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

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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
    const user = await User.findById(req.user.userId).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Failed to get user.",
    });
  }
};