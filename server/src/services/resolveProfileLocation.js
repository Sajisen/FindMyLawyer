import mongoose from "mongoose";
import Location from "../models/Location.js";

export async function resolveProfileLocation(locationId) {
  if (!mongoose.isValidObjectId(locationId)) return null;
  const location = await Location.findOne({ _id: locationId, isActive: true })
    .select("city district province").lean();
  return location && {
    officeCity: location.city,
    district: location.district,
    province: location.province,
  };
}
