import express from "express";
import { getResources } from "../controllers/resourceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", authMiddleware, getResources);

export default router;
