import express from "express";
import { chat } from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:id", authMiddleware, chat);

export default router;
