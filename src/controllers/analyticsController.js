import ActivityLog from "../models/ActivityLog.js";
import Roadmap from "../models/Roadmap.js";
import Weakness from "../models/Weakness.js";
import PDF from "../models/PDF.js";

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Weekly Activity
    const today = new Date();
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await ActivityLog.countDocuments({
        userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      chartData.push({ day: dayStr, value: count });
    }

    // 2. Quiz Scores
    const quizLogs = await ActivityLog.find({ userId, actionType: "quiz_completed" })
      .sort({ createdAt: -1 })
      .limit(5);
    const quizScores = quizLogs.map((log) => ({
      date: new Date(log.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: log.score || 0,
      max: log.maxScore || 10,
    })).reverse();

    // 3. Roadmap progress averages
    const roadmaps = await Roadmap.find({ userId });
    const roadmapProgress = roadmaps.map((r) => ({
      title: r.pdfId ? "Document Roadmap" : "Roadmap",
      progress: r.progress || 0,
    }));
    
    // Resolve PDF titles for roadmap progress
    for (let i = 0; i < roadmaps.length; i++) {
      const pdf = await PDF.findById(roadmaps[i].pdfId);
      if (pdf) {
        roadmapProgress[i].title = pdf.detectedTitle || pdf.title;
      }
    }

    const averageCompletion = roadmaps.length
      ? Math.round(roadmaps.reduce((sum, r) => sum + (r.progress || 0), 0) / roadmaps.length)
      : 0;

    // 4. Weak and Strong Topics
    const weaknessDoc = await Weakness.findOne({ userId });
    const weakTopics = [];
    const strongTopics = [];

    if (weaknessDoc && weaknessDoc.weakTopics) {
      weaknessDoc.weakTopics.forEach((t) => {
        if (t.score < 70) {
          weakTopics.push({ topic: t.topic, score: t.score });
        } else {
          strongTopics.push({ topic: t.topic, score: t.score });
        }
      });
    }

    // Default fallbacks if no topics logged
    if (weakTopics.length === 0 && strongTopics.length === 0) {
      strongTopics.push({ topic: "Foundational Definitions", score: 85 });
      weakTopics.push({ topic: "Conceptual Logic", score: 55 });
    }

    // 5. Study Time Estimate (XP based or duration count)
    const totalLogsCount = await ActivityLog.countDocuments({ userId });
    const studyHoursEstimate = Math.max(0.5, Math.round((totalLogsCount * 0.1) * 10) / 10);

    res.json({
      weeklyActivity: chartData,
      quizScores,
      roadmapProgress,
      averageCompletion,
      weakTopics,
      strongTopics,
      studyHours: studyHoursEstimate,
    });
  } catch (error) {
    console.error("Get Analytics Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
