import PDF from "../models/PDF.js";
import { generateFlashcards } from "../services/ai/flashcardService.js";

export const getFlashcards = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await PDF.findOne({ _id: id, uploadedBy: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!pdf.extractedText?.trim()) {
      return res.status(400).json({ message: "No readable text was found in this PDF" });
    }

    const { refresh } = req.query;

    if (refresh !== "true" && pdf.flashcards && pdf.flashcards.length > 0) {
      return res.json(pdf.flashcards);
    }

    const existingCards = (refresh === "true" && pdf.flashcards && pdf.flashcards.length > 0) ? pdf.flashcards : null;
    const flashcards = await generateFlashcards(pdf.extractedText, existingCards);
    
    // Save to cache
    pdf.flashcards = flashcards;
    await pdf.save();

    res.json(flashcards);
  } catch (error) {
    console.error("Flashcard Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
