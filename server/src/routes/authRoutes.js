import express from "express";

import {
  registerClient,
  registerLawyer,
  login,
  getCurrentUser,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register/client", registerClient);
router.post("/register/lawyer", registerLawyer);

router.post("/login", login);

router.get("/me", protect, getCurrentUser);

export default router;