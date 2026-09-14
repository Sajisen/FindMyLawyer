import express from "express";

import {
  getPendingLawyers,
  approveLawyer,
  rejectLawyer,
  createAdmin,
  getRegisteredClients, getRegisteredAdmins,
  decideLawyer, getAllLawyers, getLawyerActivity, getAdminActivity,
} from "../controllers/adminController.js";

import { getLawyerVerification, viewFile } from "../controllers/verificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Everything below requires:
// 1. Valid login
// 2. Admin role

router.use(protect);
router.use(allowRoles("admin"));

router.get("/lawyers/pending", getPendingLawyers);
router.get("/lawyers", getAllLawyers);
router.get("/lawyers/:id/verification", getLawyerVerification);
router.get("/lawyers/:id/activity", getLawyerActivity);
router.get("/lawyers/:lawyerId/verification/submissions/:submissionId/files/:fileId", viewFile);
router.patch("/lawyers/:id/decision", decideLawyer);
router.get("/activity", getAdminActivity);

router.patch("/lawyers/:id/approve", approveLawyer);

router.patch("/lawyers/:id/reject", rejectLawyer);

router.post("/admins", createAdmin);
router.get("/admins", getRegisteredAdmins);

router.get("/clients", getRegisteredClients);


export default router;