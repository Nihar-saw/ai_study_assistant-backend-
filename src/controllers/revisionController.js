import Revision from "../models/Revision.js";
import { awardXP } from "../services/gamificationService.js";

// Get all revision items for a user
export const getRevisions = async (req, res) => {
  try {
    const userId = req.user.id;
    const revisions = await Revision.find({ userId })
      .populate("pdfId", "title detectedTitle keyTopics")
      .sort({ completed: 1, dueTime: 1 });

    res.json(revisions);
  } catch (error) {
    console.error("Get Revisions Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create a custom scheduled revision item
export const createRevision = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pdfId, topic, dueTime } = req.body;

    if (!pdfId || !topic || !dueTime) {
      return res.status(400).json({ message: "PDF ID, topic name, and due date/time are required." });
    }

    const revision = await Revision.create({
      userId,
      pdfId,
      topic,
      dueTime: new Date(dueTime),
    });

    res.status(201).json(revision);
  } catch (error) {
    console.error("Create Revision Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark revision item as completed and reward XP
export const completeRevision = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const revision = await Revision.findOne({ _id: id, userId });
    if (!revision) {
      return res.status(404).json({ message: "Revision item not found" });
    }

    if (revision.completed) {
      return res.status(400).json({ message: "Revision item already completed" });
    }

    revision.completed = true;
    revision.completedAt = new Date();
    await revision.save();

    // Award 30 XP for completing a revision
    const gamification = await awardXP(userId, 30, "revision_completed", {
      pdfId: revision.pdfId,
      topics: [revision.topic],
    });

    res.json({ revision, gamification });
  } catch (error) {
    console.error("Complete Revision Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a revision item
export const deleteRevision = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const revision = await Revision.findOneAndDelete({ _id: id, userId });
    if (!revision) {
      return res.status(404).json({ message: "Revision item not found" });
    }

    res.json({ message: "Revision item deleted successfully" });
  } catch (error) {
    console.error("Delete Revision Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
