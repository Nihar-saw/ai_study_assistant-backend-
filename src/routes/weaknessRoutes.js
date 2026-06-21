import express from "express";
import { getWeaknesses, logActivity, getWeakTopicQuiz } from "../controllers/weaknessController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWeaknesses);
router.post("/log", authMiddleware, logActivity);
router.get("/quiz", authMiddleware, getWeakTopicQuiz);

export default router;
