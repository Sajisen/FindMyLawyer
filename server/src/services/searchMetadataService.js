import mongoose from "mongoose";

import defaultLegalCategories from "../data/defaultLegalCategories.js";
import LawyerProfile from "../models/LawyerProfile.js";
import LegalCategory from "../models/LegalCategory.js";
import Location from "../models/Location.js";

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}


async function backfillLawyerLocationIds() {
  const [locations, profiles] = await Promise.all([
    Location.find({}).select("_id city district province").lean(),
    LawyerProfile.find({
      $or: [
        { locationId: { $exists: false } },
        { locationId: null },
        { "pendingProfileChanges.officeCity": { $exists: true } },
      ],
    })
      .select("_id locationId officeCity district province pendingProfileChanges")
      .lean(),
  ]);

  if (!locations.length || !profiles.length) {
    return 0;
  }

  const byKey = new Map(
    locations.map((location) => [
      [location.city, location.district, location.province]
        .map((value) => normalize(value))
        .join("|"),
      location,
    ])
  );
  const operations = [];

  for (const profile of profiles) {
    const updates = {};

    if (!profile.locationId && profile.officeCity && profile.district && profile.province) {
      const key = [profile.officeCity, profile.district, profile.province]
        .map((value) => normalize(value))
        .join("|");
      const location = byKey.get(key);
      if (location) updates.locationId = location._id;
    }

    const pending = profile.pendingProfileChanges;
    if (
      pending?.officeCity &&
      pending?.district &&
      pending?.province &&
      !pending?.locationId
    ) {
      const key = [pending.officeCity, pending.district, pending.province]
        .map((value) => normalize(value))
        .join("|");
      const location = byKey.get(key);
      if (location) updates["pendingProfileChanges.locationId"] = location._id;
    }

    if (Object.keys(updates).length) {
      operations.push({
        updateOne: {
          filter: { _id: profile._id },
          update: { $set: updates },
        },
      });
    }
  }

  if (!operations.length) {
    return 0;
  }

  const result = await LawyerProfile.bulkWrite(operations, { ordered: false });
  return result.modifiedCount || 0;
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

  const backfilledLocations = await backfillLawyerLocationIds();
  if (backfilledLocations > 0) {
    console.log(
      `Search metadata: linked ${backfilledLocations} existing lawyer profiles to controlled locations.`
    );
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

  const matches = await Location.find({
    normalizedCity: normalize(city),
    isActive: true,
  })
    .limit(2)
    .lean();

  // City names are not guaranteed to be globally unique. Old URLs/clients may
  // still send only a city string, so accept that fallback only when it maps
  // to exactly one active controlled location. Modern clients send locationId.
  return matches.length === 1 ? matches[0] : null;
}

export async function getActiveLocations() {
  return Location.find({ isActive: true }).sort({ city: 1 }).lean();
}
