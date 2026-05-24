import express from "express";
import { uploadPDF, getPDFs, identifyExistingPDF, deletePDF } from "../controllers/pdfController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/upload", protect, upload.single("pdf"), uploadPDF);
router.get("/", protect, getPDFs);
router.post("/:id/identify", protect, identifyExistingPDF);
router.delete("/:id", protect, deletePDF);

export default router;
