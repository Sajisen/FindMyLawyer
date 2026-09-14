import mongoose from "mongoose";

import SavedLawyer from "../models/SavedLawyer.js";
import {
  findPublicLawyerById,
  findPublicLawyersByIds,
} from "./publicLawyerService.js";

export const MAX_SYNC_LAWYERS = 100;

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function containsOnlyDuplicateWriteErrors(error) {
  const writeErrors = error?.writeErrors || error?.result?.writeErrors || [];
  return writeErrors.length > 0 && writeErrors.every((item) => item?.code === 11000);
}

function normalizeIds(ids = []) {
  return [
    ...new Set(
      ids
        .map((id) => String(id))
        .filter((id) => mongoose.isValidObjectId(id))
    ),
  ];
}

export async function getSavedLawyerCollection(userId) {
  const savedRecords = await SavedLawyer.find({ userId })
    .select("lawyerId createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const orderedIds = savedRecords.map((record) => String(record.lawyerId));
  const publicLawyers = await findPublicLawyersByIds(orderedIds);
  const publicMap = new Map(
    publicLawyers.map((lawyer) => [String(lawyer._id), lawyer])
  );
  const savedAtMap = new Map(
    savedRecords.map((record) => [
      String(record.lawyerId),
      record.createdAt,
    ])
  );

  const lawyers = orderedIds
    .map((id) => {
      const lawyer = publicMap.get(id);

      if (!lawyer) {
        return null;
      }

      return {
        ...lawyer,
        savedAt: savedAtMap.get(id) || null,
      };
    })
    .filter(Boolean);

  return {
    count: lawyers.length,
    savedIds: lawyers.map((lawyer) => String(lawyer._id)),
    lawyers,
  };
}

export async function saveLawyerForUser(userId, lawyerId) {
  const lawyer = await findPublicLawyerById(lawyerId);

  if (!lawyer) {
    return null;
  }

  let result;

  try {
    result = await SavedLawyer.findOneAndUpdate(
      { userId, lawyerId },
      {
        $setOnInsert: {
          userId,
          lawyerId,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    )
      .select("createdAt")
      .lean();
  } catch (error) {
    // The unique compound index is the final duplicate guard. Two tabs can
    // still race into the same upsert, so treat a duplicate-key race as an
    // idempotent save instead of returning a 500.
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    result = await SavedLawyer.findOne({ userId, lawyerId })
      .select("createdAt")
      .lean();
  }

  return {
    ...lawyer,
    savedAt: result?.createdAt || new Date(),
  };
}

export async function removeSavedLawyerForUser(userId, lawyerId) {
  const result = await SavedLawyer.deleteOne({ userId, lawyerId });
  return result.deletedCount > 0;
}

export async function mergeGuestSavedLawyers(userId, lawyerIds = []) {
  if (!Array.isArray(lawyerIds)) {
    const error = new Error("lawyerIds must be an array.");
    error.statusCode = 400;
    throw error;
  }

  if (lawyerIds.length > MAX_SYNC_LAWYERS) {
    const error = new Error(
      `A maximum of ${MAX_SYNC_LAWYERS} saved lawyers can be synchronized at once.`
    );
    error.statusCode = 400;
    throw error;
  }

  const normalizedIds = normalizeIds(lawyerIds);
  const publicLawyers = await findPublicLawyersByIds(normalizedIds);
  const validIds = publicLawyers.map((lawyer) => String(lawyer._id));

  if (validIds.length > 0) {
    try {
      await SavedLawyer.bulkWrite(
        validIds.map((lawyerId) => ({
          updateOne: {
            filter: { userId, lawyerId },
            update: {
              $setOnInsert: {
                userId,
                lawyerId,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false }
      );
    } catch (error) {
      // Concurrent login/sync requests can race on the same unique pair. If
      // every failed write is only a duplicate, the desired union already
      // exists and synchronization can safely continue.
      if (!containsOnlyDuplicateWriteErrors(error)) {
        throw error;
      }
    }
  }

  const collection = await getSavedLawyerCollection(userId);

  return {
    ...collection,
    synchronizedCount: validIds.length,
    ignoredCount: lawyerIds.length - validIds.length,
  };
}
