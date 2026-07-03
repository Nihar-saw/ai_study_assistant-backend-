import fs from "fs";
import os from "os";
import path from "path";
import PDFParser from "pdf2json";
import PDF from "../models/PDF.js";
import { identifyPDF } from "../services/ai/identifyService.js";
import { fallbackProfile } from "../services/ai/fallbackStudyService.js";

const extractTextFromPDF = (filePath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err) => {
      reject(err.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      let text = "";

      pdfData.Pages.forEach((page) => {
        page.Texts.forEach((t) => {
          t.R.forEach((r) => {
            text += decodeURIComponent(r.T) + " ";
          });
        });
        text += "\n";
      });

      resolve(text);
    });

    pdfParser.loadPDF(filePath);
  });
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

    // Clean up temporary file immediately after text extraction
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });

    if (!extractedText) {
      return res.status(400).json({
        message: "No readable text was found in this PDF. Please upload a text-based PDF instead of a scanned image PDF.",
      });
    }

    const fallbackAiProfile = fallbackProfile(extractedText, req.file.originalname);

    const savedPDF = await PDF.create({
      title: req.file.originalname,
      filename: req.file.filename,
      extractedText,
      ...fallbackAiProfile,
      uploadedBy: req.user.id,
    });

    console.log(`PDF saved to DB: ${savedPDF._id}`);
    res.status(201).json(savedPDF);

    identifyPDF(extractedText, req.file.originalname)
      .then((aiProfile) => PDF.findByIdAndUpdate(savedPDF._id, aiProfile, { returnDocument: "after" }))
      .then(() => console.log(`PDF identification updated: ${savedPDF._id}`))
      .catch((error) => console.error("Background PDF identification failed:", error.message));
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
    const updatedPDF = await PDF.findByIdAndUpdate(id, aiProfile, { returnDocument: "after" });

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

    const filePath = path.join(os.tmpdir(), pdf.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "PDF deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
