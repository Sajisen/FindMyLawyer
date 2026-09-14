import express from "express";

import {
  getSavedLawyers,
  removeSavedLawyer,
  saveLawyer,
  syncSavedLawyers,
} from "../controllers/savedLawyerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("client"));

router.get("/", getSavedLawyers);
router.post("/sync", syncSavedLawyers);
router.post("/:lawyerId", saveLawyer);
router.delete("/:lawyerId", removeSavedLawyer);

export default router;
