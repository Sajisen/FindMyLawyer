import mongoose from "mongoose";

import demoLocations from "../data/demoLocations.json" with { type: "json" };
import { locationKey, normalize } from "../data/buildLocationCatalog.js";
import ActivityLog from "../models/ActivityLog.js";
import LawyerProfile from "../models/LawyerProfile.js";
import Location from "../models/Location.js";
import User from "../models/User.js";

const MAX_TEXT_LENGTH = 120;
const divisionsByDistrict = new Map();

for (const entry of demoLocations) {
  const key = normalize(entry.district);
  if (!divisionsByDistrict.has(key)) {
    divisionsByDistrict.set(key, {
      district: entry.district,
      province: entry.province,
    });
  }
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function parseLocationInput(body = {}, current = null) {
  const city = cleanText(body.city ?? current?.city);
  const requestedDistrict = cleanText(body.district ?? current?.district);
  const requestedProvince = cleanText(body.province ?? current?.province);

  if (!city || !requestedDistrict || !requestedProvince) {
    const error = new Error("City, district and province are required.");
    error.statusCode = 400;
    throw error;
  }

  if (
    [city, requestedDistrict, requestedProvince].some(
      (value) => value.length > MAX_TEXT_LENGTH
    )
  ) {
    const error = new Error("Location names must be 120 characters or fewer.");
    error.statusCode = 400;
    throw error;
  }

  const division = divisionsByDistrict.get(normalize(requestedDistrict));

  if (!division || normalize(division.province) !== normalize(requestedProvince)) {
    const error = new Error(
      "Choose a valid Sri Lankan district and province combination."
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    city,
    district: division.district,
    province: division.province,
  };
}

async function recordAdminAction(req, action, previous, next, reason = "", session) {
  const userQuery = User.findById(req.user.userId).select("name");
  if (session) userQuery.session(session);
  const actor = await userQuery.lean();

  const entry = {
    actor: req.user.userId,
    actorName: actor?.name || "Admin",
    actorRole: "admin",
    lawyer: null,
    action,
    previous,
    next,
    reason,
  };

  if (session) {
    const [created] = await ActivityLog.create([entry], { session });
    return created;
  }

  return ActivityLog.create(entry);
}

function currentLocationReferenceFilter(location) {
  return {
    $or: [
      { locationId: location._id },
      {
        officeCity: location.city,
        district: location.district,
        province: location.province,
      },
    ],
  };
}

function pendingLocationReferenceFilter(location) {
  return {
    $or: [
      { "pendingProfileChanges.locationId": location._id },
      {
        "pendingProfileChanges.officeCity": location.city,
        "pendingProfileChanges.district": location.district,
        "pendingProfileChanges.province": location.province,
      },
    ],
  };
}

async function propagateLocationChange(location, previous, session) {
  await LawyerProfile.updateMany(
    {
      $or: [
        { locationId: location._id },
        {
          officeCity: previous.city,
          district: previous.district,
          province: previous.province,
        },
      ],
    },
    {
      $set: {
        locationId: location._id,
        officeCity: location.city,
        district: location.district,
        province: location.province,
      },
    },
    { session }
  );

  await LawyerProfile.updateMany(
    {
      $or: [
        { "pendingProfileChanges.locationId": location._id },
        {
          "pendingProfileChanges.officeCity": previous.city,
          "pendingProfileChanges.district": previous.district,
          "pendingProfileChanges.province": previous.province,
        },
      ],
    },
    {
      $set: {
        "pendingProfileChanges.locationId": location._id,
        "pendingProfileChanges.officeCity": location.city,
        "pendingProfileChanges.district": location.district,
        "pendingProfileChanges.province": location.province,
      },
    },
    { session }
  );
}

export async function getAdminLocationDivisions(req, res) {
  const districts = [...divisionsByDistrict.values()].sort((a, b) =>
    a.district.localeCompare(b.district)
  );
  const provinces = [...new Set(districts.map((entry) => entry.province))].sort();

  return res.json({ provinces, districts });
}

export async function getAdminLocations(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(5, Number.parseInt(req.query.limit, 10) || 25)
    );
    const query = cleanText(req.query.query);
    const status = String(req.query.status || "all");

    if (!['all', 'active', 'archived'].includes(status)) {
      return res.status(400).json({ message: "Invalid location status filter." });
    }

    const filter = {};
    if (status === "active") filter.isActive = true;
    if (status === "archived") filter.isActive = false;

    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { city: { $regex: escaped, $options: "i" } },
        { district: { $regex: escaped, $options: "i" } },
        { province: { $regex: escaped, $options: "i" } },
      ];
    }

    const [total, locations] = await Promise.all([
      Location.countDocuments(filter),
      Location.find(filter)
        .sort({ province: 1, district: 1, city: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({
      locations: locations.map((location) => ({
        ...location,
        id: String(location._id),
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin locations error:", error);
    return res.status(500).json({ message: "Failed to load locations." });
  }
}

export async function createAdminLocation(req, res) {
  try {
    const values = parseLocationInput(req.body);
    const key = locationKey(values);

    if (await Location.exists({ locationKey: key })) {
      return res.status(409).json({
        message: "That city, district and province combination already exists.",
      });
    }

    const location = await Location.create({
      ...values,
      normalizedCity: normalize(values.city),
      locationKey: key,
      isActive: true,
    });

    await recordAdminAction(req, "location_created", null, {
      id: location._id,
      ...values,
      isActive: true,
    });

    return res.status(201).json({
      message: `${values.city} was added to the location catalogue.`,
      location: { ...location.toObject(), id: String(location._id) },
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ message: "That location already exists." });
    }

    console.error("Create location error:", error);
    return res.status(500).json({ message: "Failed to add location." });
  }
}

export async function updateAdminLocation(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid location ID." });
  }

  let session;

  try {
    session = await mongoose.startSession();
    let response;

    await session.withTransaction(async () => {
      const location = await Location.findById(req.params.id).session(session);
      if (!location) {
        const error = new Error("Location not found.");
        error.statusCode = 404;
        throw error;
      }

      const previous = {
        id: String(location._id),
        city: location.city,
        district: location.district,
        province: location.province,
        isActive: location.isActive,
      };
      const values = parseLocationInput(req.body, location);
      const key = locationKey(values);
      const duplicate = await Location.exists({
        _id: { $ne: location._id },
        locationKey: key,
      }).session(session);

      if (duplicate) {
        const error = new Error(
          "That city, district and province combination already exists."
        );
        error.statusCode = 409;
        throw error;
      }

      const locationDetailsChanged =
        values.city !== location.city ||
        values.district !== location.district ||
        values.province !== location.province;

      location.city = values.city;
      location.district = values.district;
      location.province = values.province;
      location.normalizedCity = normalize(values.city);
      location.locationKey = key;

      if (typeof req.body.isActive === "boolean") {
        location.isActive = req.body.isActive;
      }

      await location.save({ session });

      if (locationDetailsChanged) {
        await propagateLocationChange(location, previous, session);
      }

      const next = {
        id: String(location._id),
        city: location.city,
        district: location.district,
        province: location.province,
        isActive: location.isActive,
      };

      await recordAdminAction(
        req,
        previous.isActive === false && location.isActive
          ? "location_restored"
          : "location_updated",
        previous,
        next,
        "",
        session
      );

      response = {
        message:
          previous.isActive === false && location.isActive
            ? `${location.city} was restored.`
            : `${location.city} was updated.`,
        location: { ...location.toObject(), id: String(location._id) },
      };
    });

    return res.json(response);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ message: "That location already exists." });
    }

    console.error("Update location error:", error);
    return res.status(500).json({ message: "Failed to update location." });
  } finally {
    if (session) await session.endSession();
  }
}

export async function deleteAdminLocation(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid location ID." });
  }

  let session;

  try {
    session = await mongoose.startSession();
    let response;

    await session.withTransaction(async () => {
      const location = await Location.findById(req.params.id).session(session);
      if (!location) {
        const error = new Error("Location not found.");
        error.statusCode = 404;
        throw error;
      }

      const [currentUsage, pendingUsage] = await Promise.all([
        LawyerProfile.countDocuments(currentLocationReferenceFilter(location)).session(
          session
        ),
        LawyerProfile.countDocuments(pendingLocationReferenceFilter(location)).session(
          session
        ),
      ]);
      const usageCount = currentUsage + pendingUsage;
      const previous = {
        id: String(location._id),
        city: location.city,
        district: location.district,
        province: location.province,
        isActive: location.isActive,
      };

      if (usageCount > 0) {
        location.isActive = false;
        await location.save({ session });
        await recordAdminAction(
          req,
          "location_archived",
          previous,
          { ...previous, isActive: false, usageCount },
          "Location is referenced by lawyer profile data and was archived instead of hard-deleted.",
          session
        );

        response = {
          message: `${location.city} is used by lawyer profile data, so it was archived instead of deleted.`,
          archived: true,
          deleted: false,
          usageCount,
        };
        return;
      }

      await Location.deleteOne({ _id: location._id }, { session });
      await recordAdminAction(
        req,
        "location_deleted",
        previous,
        null,
        "",
        session
      );

      response = {
        message: `${location.city} was deleted from the location catalogue.`,
        archived: false,
        deleted: true,
        usageCount: 0,
      };
    });

    return res.json(response);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Delete location error:", error);
    return res.status(500).json({ message: "Failed to remove location." });
  } finally {
    if (session) await session.endSession();
  }
}
