import PDF from "../models/PDF.js";
import { findResources } from "../services/ai/resourceService.js";

export const getResources = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await PDF.findOne({ _id: id, uploadedBy: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!pdf.extractedText?.trim()) {
      return res.status(400).json({ message: "No readable text was found in this PDF" });
    }

    if (pdf.resources && pdf.resources.length > 0) {
      return res.json(pdf.resources);
    }

    const resources = await findResources(pdf.extractedText);
    
    // Save to cache
    pdf.resources = resources;
    await pdf.save();

    res.json(resources);
  } catch (error) {
    console.error("Resource Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
