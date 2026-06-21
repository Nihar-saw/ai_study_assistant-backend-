import PDF from "../models/PDF.js";
import Roadmap from "../models/Roadmap.js";
import { generateRoadmap } from "../services/ai/roadmapService.js";
import { awardXP } from "../services/gamificationService.js";

export const getRoadmap = async (req, res) => {
  try {
    const { pdfId } = req.params;
    const userId = req.user.id;

    // Verify PDF exists and belongs to user
    const pdf = await PDF.findOne({ _id: pdfId, uploadedBy: userId });
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    let roadmap = await Roadmap.findOne({ pdfId, userId });

    if (!roadmap) {
      console.log(`[Roadmap] Generating new roadmap for PDF: ${pdfId}`);
      const topics = await generateRoadmap(pdf.extractedText, pdf.title);
      
      roadmap = await Roadmap.create({
        pdfId,
        userId,
        topics,
        progress: 0,
      });

      // Award XP for creating a new study roadmap
      const gamification = await awardXP(userId, 50, "roadmap_generated", { pdfId });
      return res.json({ roadmap, gamification });
    }

    res.json({ roadmap });
  } catch (error) {
    console.error("Get Roadmap Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const toggleTopicComplete = async (req, res) => {
  try {
    const { pdfId, topicId } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOne({ pdfId, userId });
    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    const topic = roadmap.topics.find((t) => t.id === topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found in roadmap" });
    }

    // Toggle
    topic.isCompleted = !topic.isCompleted;

    // Recalculate progress
    const completedCount = roadmap.topics.filter((t) => t.isCompleted).length;
    roadmap.progress = Math.round((completedCount / roadmap.topics.length) * 100);

    await roadmap.save();

    let gamification = null;
    if (topic.isCompleted) {
      // Award 15 XP for completing a study topic
      gamification = await awardXP(userId, 15, "topic_completed", {
        pdfId,
        topics: [topic.name],
      });
    }

    res.json({ roadmap, gamification });
  } catch (error) {
    console.error("Toggle Topic Complete Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
