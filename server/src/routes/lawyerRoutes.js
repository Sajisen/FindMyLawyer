import express from "express";

import {
  getPublicLawyers,
  getPublicLawyersByIds,
  getPublicLawyerById,
  getMyLawyerProfile,
  updateMyLawyerProfile,
} from "../controllers/lawyerController.js";

import { getMine, submit, viewFile } from "../controllers/verificationController.js";
import {
  removeMyProfileImage,
  uploadMyProfileImage,
} from "../controllers/profileImageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import {
  profileImageUploadLimiter,
  verificationUploadLimiter,
} from "../middleware/rateLimiters.js";

const router = express.Router();

// PUBLIC
router.get("/", getPublicLawyers);
router.post("/batch", getPublicLawyersByIds);

// LAWYER - VIEW OWN PROFILE
router.get(
  "/me/profile",
  protect,
  allowRoles("lawyer"),
  getMyLawyerProfile
);

// LAWYER - UPDATE OWN PROFILE
router.patch(
  "/me/profile",
  protect,
  allowRoles("lawyer"),
  updateMyLawyerProfile
);

router.put(
  "/me/profile-image",
  protect,
  allowRoles("lawyer"),
  profileImageUploadLimiter,
  express.raw({ type: () => true, limit: "4mb" }),
  uploadMyProfileImage
);

router.delete(
  "/me/profile-image",
  protect,
  allowRoles("lawyer"),
  removeMyProfileImage
);

router.get("/me/verification", protect, allowRoles("lawyer"), getMine);
router.post(
  "/me/verification",
  protect,
  allowRoles("lawyer"),
  verificationUploadLimiter,
  express.json({ limit: "13mb" }),
  submit
);
router.get("/:lawyerId/verification/submissions/:submissionId/files/:fileId", protect, allowRoles("lawyer"), viewFile);

// PUBLIC INDIVIDUAL LAWYER
// Keep this route last so fixed paths above are not interpreted as IDs.
router.get("/:id", getPublicLawyerById);

export default router;
