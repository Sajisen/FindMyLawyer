import express from "express";

import {
  getPublicLawyers,
  getPublicLawyersByIds,
  getPublicLawyerById,
  getMyLawyerProfile,
  updateMyLawyerProfile,
} from "../controllers/lawyerController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

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

// PUBLIC INDIVIDUAL LAWYER
// Keep this route last so fixed paths above are not interpreted as IDs.
router.get("/:id", getPublicLawyerById);

export default router;
