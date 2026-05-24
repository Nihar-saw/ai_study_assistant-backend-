import express from "express";

import { summarizePDF } from "../controllers/summaryController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", protect, summarizePDF);

export default router;