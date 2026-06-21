import ActivityLog from "../models/ActivityLog.js";
import Weakness from "../models/Weakness.js";
import PDF from "../models/PDF.js";
import { analyzeWeakness } from "../services/ai/weaknessService.js";
import { awardXP } from "../services/gamificationService.js";
import { getGeminiModel } from "../services/ai/geminiClient.js";
import { parseAiJsonArray } from "../utils/parseAiJson.js";
import { limitText } from "../utils/text.js";
import { shuffleArray } from "../utils/array.js";

export const getWeaknesses = async (req, res) => {
  try {
    const userId = req.user.id;
    const weakness = await Weakness.findOne({ userId });
    res.json(weakness || { weakTopics: [], recommendations: [] });
  } catch (error) {
    console.error("Get Weaknesses Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const logActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { actionType, pdfId, score, maxScore, topics } = req.body;

    let xpAward = 10; // default baseline XP
    if (actionType === "quiz_completed") {
      // Award 15 XP per correct answer + 20 completion XP
      const correctAnswers = score || 0;
      xpAward = (correctAnswers * 15) + 20;
    } else if (actionType === "flashcard_reviewed") {
      // Award 5 XP for reviewing
      xpAward = 5;
    }

    // Award XP and log the activity
    const gamification = await awardXP(userId, xpAward, actionType, {
      pdfId,
      score,
      maxScore,
      topics,
    });

    // Fetch recent logs to identify weaknesses
    const logs = await ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(20);
    const currentWeakness = await Weakness.findOne({ userId }) || { weakTopics: [], recommendations: [] };

    // Trigger AI background weakness detection
    console.log("[Weakness] Analyzing weaknesses in background...");
    const analysis = await analyzeWeakness(logs, currentWeakness.weakTopics);
    
    // Save weakness report
    let weakness = await Weakness.findOne({ userId });
    if (!weakness) {
      weakness = new Weakness({ userId });
    }
    weakness.weakTopics = analysis.weakTopics;
    weakness.recommendations = analysis.recommendations;
    await weakness.save();

    res.json({ gamification, weakness });
  } catch (error) {
    console.error("Log Activity Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getWeakTopicQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic } = req.query;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    // Find any PDF containing this topic
    let pdf = await PDF.findOne({ uploadedBy: userId, keyTopics: { $in: [new RegExp(topic, "i")] } });
    if (!pdf) {
      // Fallback to latest PDF
      pdf = await PDF.findOne({ uploadedBy: userId }).sort({ createdAt: -1 });
    }

    if (!pdf) {
      return res.status(404).json({ message: "No PDF found to generate questions from" });
    }

    console.log(`[Weakness] Spawning custom quiz on topic "${topic}" using PDF: ${pdf._id}`);
    const model = getGeminiModel();
    const prompt = `
    Based on the following text, generate exactly 5 conceptual multiple-choice questions focusing specifically on the topic: "${topic}".
    
    Return ONLY a JSON array of objects.
    Each object must have: "question", "options" (array of 4 strings), and "correctAnswer" (one of the options).
    Do not add markdown formatting wrappers except JSON.
    
    Text:
    ${limitText(pdf.extractedText, 8000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();
    const quiz = parseAiJsonArray(responseText, "Custom Topic Quiz");
    if (Array.isArray(quiz)) {
      const shuffledQuiz = quiz.map(q => ({
        ...q,
        options: q.options ? shuffleArray(q.options) : []
      }));
      res.json(shuffledQuiz);
    } else {
      res.json(quiz);
    }
  } catch (error) {
    console.error("Get Weak Topic Quiz Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
