import PDF from "../models/PDF.js";
import { chatWithPDF } from "../services/ai/chatService.js";

export const chat = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, history } = req.body;
    const pdf = await PDF.findOne({ _id: id, uploadedBy: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!pdf.extractedText?.trim()) {
      return res.status(400).json({ message: "No readable text was found in this PDF" });
    }

    const response = await chatWithPDF(pdf.extractedText, message, history);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
