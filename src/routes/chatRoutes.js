import express from "express";
import { chat, clearChatHistory, getChatHistory } from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", authMiddleware, getChatHistory);
router.post("/:id", authMiddleware, chat);
router.delete("/:id", authMiddleware, clearChatHistory);

export default router;
