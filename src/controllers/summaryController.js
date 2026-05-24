import PDF from "../models/PDF.js";
import { generateSummary } from "../services/aiService.js";

export const summarizePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const pdf = await PDF.findOne({ _id: id, uploadedBy: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!pdf.extractedText?.trim()) {
      return res.status(400).json({ message: "No readable text was found in this PDF" });
    }

    if (pdf.summary) {
      return res.json({ summary: pdf.summary });
    }

    const summary = await generateSummary(pdf.extractedText);
    
    // Save to cache
    pdf.summary = summary;
    await pdf.save();

    res.json({ summary });
  } catch (error) {
    console.error("Summary Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
