import mongoose from "mongoose";

import defaultLegalCategories from "../data/defaultLegalCategories.js";
import LawyerProfile from "../models/LawyerProfile.js";
import LegalCategory from "../models/LegalCategory.js";
import Location from "../models/Location.js";

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

export async function ensureSearchMetadata() {
  const categoryCount = await LegalCategory.countDocuments();

  if (categoryCount === 0) {
    await LegalCategory.insertMany(
      defaultLegalCategories.map((category) => ({
        categoryId: category.id,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
      }))
    );

    console.log(
      `Search metadata: seeded ${defaultLegalCategories.length} legal categories.`
    );
  }

  const locationCount = await Location.countDocuments();

  if (locationCount === 0) {
    // Initial migration only: turn the existing demo dataset into its own
    // controlled location collection. Public search no longer depends on
    // lawyer-entered city text after this bootstrap.
    const demoLocations = await LawyerProfile.find({
      isDemo: true,
      officeCity: { $exists: true, $nin: [null, ""] },
      district: { $exists: true, $nin: [null, ""] },
      province: { $exists: true, $nin: [null, ""] },
    })
      .select("officeCity district province")
      .lean();

    const uniqueLocations = new Map();

    for (const profile of demoLocations) {
      const city = profile.officeCity?.trim();
      const district = profile.district?.trim();
      const province = profile.province?.trim();

      if (!city || !district || !province) {
        continue;
      }

      const normalizedCity = normalize(city);
      const locationKey = [city, district, province]
        .map((value) => normalize(value))
        .join("|");

      if (!uniqueLocations.has(locationKey)) {
        uniqueLocations.set(locationKey, {
          city,
          district,
          province,
          normalizedCity,
          locationKey,
          isActive: true,
        });
      }
    }

    if (uniqueLocations.size > 0) {
      await Location.insertMany([...uniqueLocations.values()]);
      console.log(
        `Search metadata: seeded ${uniqueLocations.size} controlled locations from demo data.`
      );
    } else {
      console.warn(
        "Search metadata: no demo locations were available to seed the locations collection."
      );
    }
  }
}

export async function getActiveLegalCategories() {
  return LegalCategory.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
}

export async function getActiveLegalCategory(categoryId) {
  if (!categoryId) {
    return null;
  }

  return LegalCategory.findOne({
    categoryId: normalize(categoryId),
    isActive: true,
  }).lean();
}

export async function getActiveLocation({ locationId = "", city = "" } = {}) {
  if (locationId && mongoose.isValidObjectId(locationId)) {
    const location = await Location.findOne({
      _id: locationId,
      isActive: true,
    }).lean();

    if (location) {
      return location;
    }
  }

  if (!city?.trim()) {
    return null;
  }

  return Location.findOne({
    normalizedCity: normalize(city),
    isActive: true,
  }).lean();
}

export async function getActiveLocations() {
  return Location.find({ isActive: true }).sort({ city: 1 }).lean();
}
