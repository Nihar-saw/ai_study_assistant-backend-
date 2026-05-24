import PDF from "../models/PDF.js";
import { generateQuiz } from "../services/ai/quizService.js";

export const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await PDF.findOne({ _id: id, uploadedBy: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!pdf.extractedText?.trim()) {
      return res.status(400).json({ message: "No readable text was found in this PDF" });
    }

    if (pdf.quiz && pdf.quiz.length > 0) {
      return res.json(pdf.quiz);
    }

    const quiz = await generateQuiz(pdf.extractedText);
    
    // Save to cache
    pdf.quiz = quiz;
    await pdf.save();

    res.json(quiz);
  } catch (error) {
    console.error("Quiz Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
