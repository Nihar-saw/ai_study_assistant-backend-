import PDF from "../models/PDF.js";
import { generateQuiz } from "../services/ai/quizService.js";
import { shuffleArray } from "../utils/array.js";

export const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { refresh } = req.query;
    const pdf = await PDF.findOne({ _id: id, uploadedBy: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!pdf.extractedText?.trim()) {
      return res.status(400).json({ message: "No readable text was found in this PDF" });
    }

    if (refresh !== "true" && pdf.quiz && pdf.quiz.length > 0) {
      const shuffledQuiz = pdf.quiz.map(q => ({
        ...q,
        options: q.options ? shuffleArray(q.options) : []
      }));
      return res.json(shuffledQuiz);
    }

    const existingQuestions = pdf.previousQuestions || [];
    const quiz = await generateQuiz(pdf.extractedText, existingQuestions);
    
    // Save to cache and update question history to avoid repeats
    pdf.quiz = quiz;
    if (Array.isArray(quiz)) {
      const newQuestionTexts = quiz.map(q => q.question).filter(Boolean);
      let updatedHistory = [...new Set([...(pdf.previousQuestions || []), ...newQuestionTexts])];
      if (updatedHistory.length > 100) {
        updatedHistory = updatedHistory.slice(-100);
      }
      pdf.previousQuestions = updatedHistory;
    }
    await pdf.save();

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
    console.error("Quiz Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
