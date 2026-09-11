import express from "express";

import {
  getPublicLawyers,
  getPublicLawyerById,
  getMyLawyerProfile,
  updateMyLawyerProfile,
} from "../controllers/lawyerController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();


// PUBLIC
router.get("/", getPublicLawyers);



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

//individual Lawyer
router.get("/:id", getPublicLawyerById);



export default router;