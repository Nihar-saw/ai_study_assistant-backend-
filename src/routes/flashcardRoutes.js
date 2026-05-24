import express from "express";
import { getFlashcards } from "../controllers/flashcardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", authMiddleware, getFlashcards);

export default router;
