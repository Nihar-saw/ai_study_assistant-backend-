import express from "express";
import { getSessions, startSession, sendMessage } from "../controllers/interviewController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getSessions);
router.post("/start", authMiddleware, startSession);
router.post("/:sessionId/message", authMiddleware, sendMessage);

export default router;
