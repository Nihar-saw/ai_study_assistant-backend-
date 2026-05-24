import express from "express";
import { getQuiz } from "../controllers/quizController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", authMiddleware, getQuiz);

export default router;
