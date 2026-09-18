import mongoose from "mongoose";

import { locationKey, normalize } from "../data/buildLocationCatalog.js";

const locationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    province: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedCity: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    locationKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ normalizedCity: 1 });
locationSchema.index({ city: 1 });
locationSchema.index({ district: 1 });
locationSchema.index({ province: 1 });

locationSchema.pre("validate", function normalizeLocationRecord() {
  this.city = String(this.city || "").trim().replace(/\s+/g, " ");
  this.district = String(this.district || "").trim().replace(/\s+/g, " ");
  this.province = String(this.province || "").trim().replace(/\s+/g, " ");
  this.normalizedCity = normalize(this.city);
  this.locationKey = locationKey(this);
});

const Location = mongoose.model("Location", locationSchema, "locations");

export default Location;
