import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["free", "standard", "premium"],
      default: "free",
    },

    exposureLimit: {
      type: Number,
      default: 10,
    },

    exposureUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const lawyerSchema = new mongoose.Schema(
  {
    demoId: {
      type: String,
      index: true,
    },

    isDemo: {
      type: Boolean,
      default: false,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    professionalTitle: {
      type: String,
      default: "Attorney-at-Law",
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    officeCity: {
      type: String,
      required: true,
      index: true,
    },

    district: {
      type: String,
      required: true,
      index: true,
    },

    province: {
      type: String,
      required: true,
      index: true,
    },

    primaryPracticeArea: {
      type: String,
      required: true,
      index: true,
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
      default: 0,
    },

    description: {
      type: String,
      maxlength: 1000,
    },

    verificationStatus: {
      type: String,
      enum: [
        "pending",
        "verified",
        "rejected",
        "demo_verified",
      ],
      default: "pending",
    },

    acceptingNewClients: {
      type: Boolean,
      default: true,
    },

    subscription: {
      type: subscriptionSchema,
      default: () => ({
        plan: "free",
        exposureLimit: 10,
        exposureUsed: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Lawyer", lawyerSchema);