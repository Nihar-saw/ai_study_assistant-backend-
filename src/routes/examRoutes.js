import express from "express";
import { getExamPrep } from "../controllers/examController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:pdfId", authMiddleware, getExamPrep);

export default router;
