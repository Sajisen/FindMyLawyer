import express from "express";

import {
  getPendingLawyers,
  approveLawyer,
  rejectLawyer,
  createAdmin,
  getRegisteredClients,
} from "../controllers/adminController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Everything below requires:
// 1. Valid login
// 2. Admin role

router.use(protect);
router.use(allowRoles("admin"));

router.get("/lawyers/pending", getPendingLawyers);

router.patch("/lawyers/:id/approve", approveLawyer);

router.patch("/lawyers/:id/reject", rejectLawyer);

router.post("/admins", createAdmin);

router.get("/clients", getRegisteredClients);


export default router;