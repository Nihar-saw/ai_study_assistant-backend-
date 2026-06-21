import express from "express";
import { getRevisions, createRevision, completeRevision, deleteRevision } from "../controllers/revisionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getRevisions);
router.post("/", createRevision);
router.put("/:id/complete", completeRevision);
router.delete("/:id", deleteRevision);

export default router;
