import express from "express";
import { getMindMap } from "../controllers/mindMapController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:pdfId", authMiddleware, getMindMap);

export default router;
