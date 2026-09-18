import ActivityLog from "../models/ActivityLog.js";
import LawyerProfile from "../models/LawyerProfile.js";
import User from "../models/User.js";
import {
  deleteProfileImageByUrl,
  ProfileImageValidationError,
  saveProfileImage,
} from "../services/profileImageStorage.js";

async function actorName(userId) {
  const user = await User.findById(userId).select("name").lean();
  return user?.name || "Lawyer";
}

export async function uploadMyProfileImage(req, res) {
  let savedImage = null;

  try {
    const profile = await LawyerProfile.findOne({
      userId: req.user.userId,
      isDemo: { $ne: true },
    });

    if (!profile) {
      return res.status(404).json({ message: "Lawyer profile not found." });
    }

    savedImage = await saveProfileImage(req.body, req.headers["content-type"]);
    const previousUrl = profile.profileImageUrl || "";

    profile.profileImageUrl = savedImage.publicUrl;
    await profile.save();

    try {
      await ActivityLog.create({
        actor: req.user.userId,
        actorName: await actorName(req.user.userId),
        actorRole: "lawyer",
        lawyer: profile._id,
        action: "profile_image_updated",
        previous: { profileImageUrl: previousUrl || null },
        next: { profileImageUrl: profile.profileImageUrl },
      });
    } catch (activityError) {
      console.error("Profile image activity log error:", activityError);
    }

    // Only remove the previous file after the database references the new one.
    // Cleanup failure should not make a successful profile update look failed.
    if (previousUrl && previousUrl !== profile.profileImageUrl) {
      deleteProfileImageByUrl(previousUrl).catch((error) => {
        console.error("Old profile image cleanup error:", error);
      });
    }

    return res.json({
      message: "Profile image updated.",
      profileImageUrl: profile.profileImageUrl,
    });
  } catch (error) {
    if (savedImage?.publicUrl) {
      try {
        await deleteProfileImageByUrl(savedImage.publicUrl);
      } catch (cleanupError) {
        console.error("Failed profile image upload cleanup:", cleanupError);
      }
    }

    if (error instanceof ProfileImageValidationError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Upload profile image error:", error);
    return res.status(500).json({ message: "Failed to update profile image." });
  }
}

export async function removeMyProfileImage(req, res) {
  try {
    const profile = await LawyerProfile.findOne({
      userId: req.user.userId,
      isDemo: { $ne: true },
    });

    if (!profile) {
      return res.status(404).json({ message: "Lawyer profile not found." });
    }

    const previousUrl = profile.profileImageUrl || "";

    if (!previousUrl) {
      return res.json({ message: "No profile image is currently set.", profileImageUrl: "" });
    }

    profile.profileImageUrl = "";
    await profile.save();

    try {
      await ActivityLog.create({
        actor: req.user.userId,
        actorName: await actorName(req.user.userId),
        actorRole: "lawyer",
        lawyer: profile._id,
        action: "profile_image_removed",
        previous: { profileImageUrl: previousUrl },
        next: { profileImageUrl: null },
      });
    } catch (activityError) {
      console.error("Profile image removal activity log error:", activityError);
    }

    deleteProfileImageByUrl(previousUrl).catch((error) => {
      console.error("Removed profile image cleanup error:", error);
    });

    return res.json({
      message: "Profile image removed.",
      profileImageUrl: "",
    });
  } catch (error) {
    console.error("Remove profile image error:", error);
    return res.status(500).json({ message: "Failed to remove profile image." });
  }
}
