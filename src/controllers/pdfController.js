import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import PDF from "../models/PDF.js";
import { identifyPDF } from "../services/ai/identifyService.js";

const extractTextFromPDF = async (filePath) => {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let extractedText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item) => item.str);
      extractedText += `${textItems.join(" ")}\n\n`;
    }

    return extractedText.trim();
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log(`Uploading file: ${req.file.originalname}`);
    const filePath = req.file.path;
    
    const extractedText = await extractTextFromPDF(filePath);
    console.log("Text extraction successful");

    if (!extractedText) {
      return res.status(400).json({
        message: "No readable text was found in this PDF. Please upload a text-based PDF instead of a scanned image PDF.",
      });
    }

    let aiProfile = {};
    try {
      aiProfile = await identifyPDF(extractedText, req.file.originalname);
      console.log("PDF identification successful");
    } catch (error) {
      console.error("PDF identification failed:", error.message);
    }

    const savedPDF = await PDF.create({
      title: req.file.originalname,
      filename: req.file.filename,
      extractedText,
      ...aiProfile,
      uploadedBy: req.user.id,
    });

    console.log(`PDF saved to DB: ${savedPDF._id}`);
    res.status(201).json(savedPDF);
  } catch (error) {
    console.error("Upload PDF Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getPDFs = async (req, res) => {
  try {
    const pdfs = await PDF.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const identifyExistingPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await PDF.findOne({ _id: id, uploadedBy: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!pdf.extractedText?.trim()) {
      return res.status(400).json({ message: "No readable text was found in this PDF" });
    }

    const aiProfile = await identifyPDF(pdf.extractedText, pdf.title);
    const updatedPDF = await PDF.findByIdAndUpdate(id, aiProfile, { new: true });

    res.json(updatedPDF);
  } catch (error) {
    console.error("Identify PDF Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await PDF.findOneAndDelete({ _id: id, uploadedBy: req.user.id });
    
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    const filePath = `uploads/${pdf.filename}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "PDF deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
