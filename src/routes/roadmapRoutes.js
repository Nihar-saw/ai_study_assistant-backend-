import express from "express";
import { getRoadmap, toggleTopicComplete } from "../controllers/roadmapController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:pdfId", authMiddleware, getRoadmap);
router.post("/:pdfId/toggle/:topicId", authMiddleware, toggleTopicComplete);

export default router;
