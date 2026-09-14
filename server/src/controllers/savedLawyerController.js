import mongoose from "mongoose";

import {
  getSavedLawyerCollection,
  mergeGuestSavedLawyers,
  removeSavedLawyerForUser,
  saveLawyerForUser,
} from "../services/savedLawyerService.js";

export async function getSavedLawyers(req, res) {
  try {
    const result = await getSavedLawyerCollection(req.user.userId);
    return res.json(result);
  } catch (error) {
    console.error("Get saved lawyers error:", error);
    return res.status(500).json({
      message: "Failed to load saved lawyers.",
    });
  }
}

export async function saveLawyer(req, res) {
  try {
    const { lawyerId } = req.params;

    if (!mongoose.isValidObjectId(lawyerId)) {
      return res.status(400).json({
        message: "Invalid lawyer ID.",
      });
    }

    const lawyer = await saveLawyerForUser(
      req.user.userId,
      lawyerId
    );

    if (!lawyer) {
      return res.status(404).json({
        message: "This lawyer profile is not available for saving.",
      });
    }

    return res.status(200).json({
      message: "Lawyer saved.",
      lawyer,
    });
  } catch (error) {
    console.error("Save lawyer error:", error);
    return res.status(500).json({
      message: "Failed to save lawyer.",
    });
  }
}

export async function removeSavedLawyer(req, res) {
  try {
    const { lawyerId } = req.params;

    if (!mongoose.isValidObjectId(lawyerId)) {
      return res.status(400).json({
        message: "Invalid lawyer ID.",
      });
    }

    const removed = await removeSavedLawyerForUser(
      req.user.userId,
      lawyerId
    );

    return res.json({
      message: removed ? "Lawyer removed from saved." : "Lawyer was not saved.",
      lawyerId,
      removed,
    });
  } catch (error) {
    console.error("Remove saved lawyer error:", error);
    return res.status(500).json({
      message: "Failed to remove saved lawyer.",
    });
  }
}

export async function syncSavedLawyers(req, res) {
  try {
    const { lawyerIds = [] } = req.body;
    const result = await mergeGuestSavedLawyers(
      req.user.userId,
      lawyerIds
    );

    return res.json({
      message: "Saved lawyers synchronized.",
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error("Sync saved lawyers error:", error);
    return res.status(500).json({
      message: "Failed to synchronize saved lawyers.",
    });
  }
}
