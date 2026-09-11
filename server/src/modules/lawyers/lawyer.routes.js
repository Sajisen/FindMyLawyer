import { Router } from "express";

import {
  getLawyers,
} from "./lawyer.controller.js";

const router = Router();

router.get("/", getLawyers);

export default router;