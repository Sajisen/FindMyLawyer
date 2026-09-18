import mongoose from "mongoose";

const lawyerProfileSchema = new mongoose.Schema(
  {
    // Real registered lawyers only
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },

    // Existing demo lawyers
    demoId: {
      type: String,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    professionalTitle: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    normalizedPhone: {
      type: String,
      trim: true,
    },

    profileImageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },

    officeCity: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },

    province: {
      type: String,
      trim: true,
    },

    primaryPracticeArea: {
      type: String,
      trim: true,
    },

    practiceAreas: {
      type: [String],
      default: [],
    },

    subAreas: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },

    consultationModes: {
      type: [String],
      default: [],
    },

    yearsOfPractice: {
      type: Number,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
    },

    acceptingNewClients: {
      type: Boolean,
      default: true,
    },

    // Real lawyers:
    // false = not verified/not public
    // true  = verified and public
    isPublished: {
      type: Boolean,
      default: false,
    },

    isDemo: {
      type: Boolean,
      default: false,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Approved lawyers keep their currently verified public data live while
    // material profile changes wait for an administrator review. Only
    // backend-validated fields are ever written into this object.
    pendingProfileChanges: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    pendingProfileChangesSubmittedAt: {
      type: Date,
      default: null,
    },

    profileUpdateRejectionReason: {
      type: String,
      default: null,
    },

    // Existing demo compatibility
    verificationStatus: {
      type: String,
    },

    // Existing demo compatibility.
    // We aren't developing subscriptions.
    subscription: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

lawyerProfileSchema.index(
  { normalizedPhone: 1 },
  {
    unique: true,
    partialFilterExpression: { isDemo: false, normalizedPhone: { $type: "string" } },
  }
);

const LawyerProfile = mongoose.model(
  "LawyerProfile",
  lawyerProfileSchema,
  "lawyers"
);

export default LawyerProfile;
