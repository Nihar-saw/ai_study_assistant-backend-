import PDF from "../models/PDF.js";
import MindMap from "../models/MindMap.js";
import { generateMindMap } from "../services/ai/mindmapService.js";
import { awardXP } from "../services/gamificationService.js";

export const getMindMap = async (req, res) => {
  try {
    const { pdfId } = req.params;
    const userId = req.user.id;

    // Verify PDF ownership
    const pdf = await PDF.findOne({ _id: pdfId, uploadedBy: userId });
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    let mindmap = await MindMap.findOne({ pdfId, userId });

    if (!mindmap) {
      console.log(`[MindMap] Generating new mind map for PDF: ${pdfId}`);
      const { nodes, edges } = await generateMindMap(pdf.extractedText, pdf.title);

      mindmap = await MindMap.create({
        pdfId,
        userId,
        nodes,
        edges,
      });

      // Award 40 XP for generating mind map
      const gamification = await awardXP(userId, 40, "mindmap_generated", { pdfId });
      return res.json({ mindmap, gamification });
    }

    res.json({ mindmap });
  } catch (error) {
    console.error("Get MindMap Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
