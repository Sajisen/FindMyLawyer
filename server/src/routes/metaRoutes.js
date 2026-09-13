import express from "express";

import {
  getPublicCategories,
  getPublicLocations,
} from "../controllers/metaController.js";

const router = express.Router();

router.get("/categories", getPublicCategories);
router.get("/locations", getPublicLocations);

export default router;
