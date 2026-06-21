import PDF from "../models/PDF.js";
import ExamPrep from "../models/ExamPrep.js";
import { generateExamPrep } from "../services/ai/examService.js";
import { awardXP } from "../services/gamificationService.js";

export const getExamPrep = async (req, res) => {
  try {
    const { pdfId } = req.params;
    const { mode = "University" } = req.query;
    const userId = req.user.id;

    // Check PDF access
    const pdf = await PDF.findOne({ _id: pdfId, uploadedBy: userId });
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    let prep = await ExamPrep.findOne({ pdfId, userId, mode });

    if (!prep) {
      console.log(`[Exam] Generating exam prep for PDF: ${pdfId}, mode: ${mode}`);
      const data = await generateExamPrep(pdf.extractedText, mode);
      
      prep = await ExamPrep.create({
        pdfId,
        userId,
        mode,
        data,
      });

      // Award 30 XP for generating custom exam questions
      const gamification = await awardXP(userId, 30, "exam_prep_generated", { pdfId });
      return res.json({ prep, gamification });
    }

    res.json({ prep });
  } catch (error) {
    console.error("Get Exam Prep Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
