import mongoose from "mongoose";

const savedLawyerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lawyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawyerProfile",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

savedLawyerSchema.index(
  { userId: 1, lawyerId: 1 },
  { unique: true }
);

const SavedLawyer = mongoose.model(
  "SavedLawyer",
  savedLawyerSchema,
  "savedLawyers"
);

export default SavedLawyer;
