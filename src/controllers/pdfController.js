import fs from "fs";
import os from "os";
import path from "path";
import PDFParser from "pdf2json";
import PDF from "../models/PDF.js";
import ActivityLog from "../models/ActivityLog.js";
import Chat from "../models/Chat.js";
import ExamPrep from "../models/ExamPrep.js";
import Flashcard from "../models/Flashcard.js";
import InterviewSession from "../models/InterviewSession.js";
import MindMap from "../models/MindMap.js";
import Note from "../models/Note.js";
import Quiz from "../models/Quiz.js";
import Revision from "../models/Revision.js";
import Roadmap from "../models/Roadmap.js";
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
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log(`Uploading file: ${req.file.originalname}`);
    filePath = req.file.path;
    
    const extractedText = (await extractTextFromPDF(filePath)).replace(/\s+/g, " ").trim();
    console.log("Text extraction successful");

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
  } finally {
    if (filePath) {
      fs.unlink(filePath, (error) => {
        if (error && error.code !== "ENOENT") {
          console.error("Failed to delete temp file:", error);
        }
      });
    }
  }
};

export const getPDFs = async (req, res) => {
  try {
    const pdfs = await PDF.find({ uploadedBy: req.user.id })
      .select("-extractedText")
      .sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPDF = async (req, res) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
    });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    await Promise.all([
      ActivityLog.deleteMany({ userId: req.user.id, pdfId: id }),
      Chat.deleteMany({ userId: req.user.id, contextKey: id }),
      ExamPrep.deleteMany({ userId: req.user.id, pdfId: id }),
      Flashcard.deleteMany({ userId: req.user.id, pdfId: id }),
      InterviewSession.deleteMany({ userId: req.user.id, pdfId: id }),
      MindMap.deleteMany({ userId: req.user.id, pdfId: id }),
      Note.deleteMany({ userId: req.user.id, pdfId: id }),
      Quiz.deleteMany({ userId: req.user.id, pdfId: id }),
      Revision.deleteMany({ userId: req.user.id, pdfId: id }),
      Roadmap.deleteMany({ userId: req.user.id, pdfId: id }),
    ]);

    res.json(pdf);
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
