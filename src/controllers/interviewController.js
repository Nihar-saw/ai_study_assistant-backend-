import PDF from "../models/PDF.js";
import InterviewSession from "../models/InterviewSession.js";
import { 
  generateOpeningQuestion, 
  generateNextInterviewTurn, 
  evaluateInterviewSession 
} from "../services/ai/interviewService.js";
import { awardXP } from "../services/gamificationService.js";

export const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await InterviewSession.find({ userId }).populate("pdfId", "title detectedTitle").sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error("Get Sessions Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const startSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pdfId, type = "Technical" } = req.body;
    const allowedTypes = ["Technical", "HR", "Scenario", "Viva"];

    if (!pdfId) {
      return res.status(400).json({ message: "PDF is required" });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid interview type" });
    }

    const pdf = await PDF.findOne({ _id: pdfId, uploadedBy: userId });
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    const openingQuestion = await generateOpeningQuestion(pdf.extractedText, type);

    const session = await InterviewSession.create({
      userId,
      pdfId,
      type,
      messages: [{
        role: "interviewer",
        content: openingQuestion,
      }],
      isCompleted: false,
    });

    res.status(201).json(session);
  } catch (error) {
    console.error("Start Session Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Interview response is required" });
    }

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.isCompleted) {
      return res.status(400).json({ message: "Session is already completed" });
    }

    const pdf = await PDF.findOne({ _id: session.pdfId, uploadedBy: userId });
    if (!pdf) {
      return res.status(404).json({ message: "Associated PDF not found" });
    }

    // 1. Save candidate message
    session.messages.push({
      role: "candidate",
      content: message.trim(),
    });

    // We complete the mock interview session after 3 candidate responses (total 6 messages)
    const candidateMessagesCount = session.messages.filter((m) => m.role === "candidate").length;
    let gamification = null;

    if (candidateMessagesCount >= 3) {
      // Complete interview and evaluate
      session.isCompleted = true;
      const evaluation = await evaluateInterviewSession(session.messages, pdf.extractedText, session.type);
      session.evaluation = evaluation;
      
      await session.save();

      // Award 80 XP for finishing a full interview
      gamification = await awardXP(userId, 80, "interview_completed", {
        pdfId: session.pdfId,
        score: evaluation.score,
        maxScore: 100,
      });
    } else {
      // Generate next interviewer question
      const nextQuestion = await generateNextInterviewTurn(session.messages, message.trim(), pdf.extractedText, session.type);
      session.messages.push({
        role: "interviewer",
        content: nextQuestion,
      });

      await session.save();
      
      // Award 10 XP per reply
      gamification = await awardXP(userId, 10, "interview_reply", { pdfId: session.pdfId });
    }

    res.json({ session, gamification });
  } catch (error) {
    console.error("Send Message Interview Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};
