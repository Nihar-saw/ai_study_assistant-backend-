import express from "express";
import { getStudyPlan, createStudyPlan, toggleTaskComplete } from "../controllers/studyPlannerController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getStudyPlan);
router.post("/create", authMiddleware, createStudyPlan);
router.post("/toggle-task", authMiddleware, toggleTaskComplete);

export default router;
