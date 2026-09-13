import express from "express";

import { classifySituation } from "../controllers/aiController.js";

const router = express.Router();

router.post("/classify", classifySituation);

export default router;
