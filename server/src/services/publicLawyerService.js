import mongoose from "mongoose";

import LawyerProfile from "../models/LawyerProfile.js";

export const PUBLIC_LAWYER_VISIBILITY = {
  $or: [
    {
      isDemo: true,
      verificationStatus: "demo_verified",
    },
    {
      isDemo: { $ne: true },
      isPublished: true,
    },
  ],
};

export const PUBLIC_LAWYER_FIELDS = [
  "displayName",
  "professionalTitle",
  "email",
  "phone",
  "officeCity",
  "district",
  "province",
  "primaryPracticeArea",
  "practiceAreas",
  "subAreas",
  "languages",
  "consultationModes",
  "yearsOfPractice",
  "description",
  "acceptingNewClients",
].join(" ");

export const PUBLIC_LAWYER_PROJECT = {
  displayName: 1,
  professionalTitle: 1,
  email: 1,
  phone: 1,
  officeCity: 1,
  district: 1,
  province: 1,
  primaryPracticeArea: 1,
  practiceAreas: 1,
  subAreas: 1,
  languages: 1,
  consultationModes: 1,
  yearsOfPractice: 1,
  description: 1,
  acceptingNewClients: 1,
};

export function isValidLawyerId(id) {
  return mongoose.isValidObjectId(id);
}

export async function findPublicLawyerById(id) {
  if (!isValidLawyerId(id)) {
    return null;
  }

  return LawyerProfile.findOne({
    _id: id,
    ...PUBLIC_LAWYER_VISIBILITY,
  })
    .select(PUBLIC_LAWYER_FIELDS)
    .lean();
}

export async function findPublicLawyersByIds(ids = []) {
  const uniqueIds = [
    ...new Set(
      ids
        .map((id) => String(id))
        .filter((id) => mongoose.isValidObjectId(id))
    ),
  ];

  if (uniqueIds.length === 0) {
    return [];
  }

  const lawyers = await LawyerProfile.find({
    _id: { $in: uniqueIds },
    ...PUBLIC_LAWYER_VISIBILITY,
  })
    .select(PUBLIC_LAWYER_FIELDS)
    .lean();

  const lawyerMap = new Map(
    lawyers.map((lawyer) => [String(lawyer._id), lawyer])
  );

  return uniqueIds
    .map((id) => lawyerMap.get(id))
    .filter(Boolean);
}
