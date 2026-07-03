import PDF from "../models/PDF.js";
import Chat from "../models/Chat.js";
import { chatWithPDF } from "../services/ai/chatService.js";

const getContext = async (id, userId) => {
  if (id === "general") {
    return {
      contextKey: "general",
      pdfId: null,
      text: "General academic and study assistant knowledge.",
    };
  }

  const pdf = await PDF.findOne({ _id: id, uploadedBy: userId });
  if (!pdf) return null;

  return {
    contextKey: id,
    pdfId: pdf._id,
    text: pdf.extractedText,
  };
};

export const getChatHistory = async (req, res) => {
  try {
    const context = await getContext(req.params.id, req.user.id);
    if (!context) {
      return res.status(404).json({ message: "PDF not found" });
    }

    const chat = await Chat.findOne({
      userId: req.user.id,
      contextKey: context.contextKey,
    });

    res.json({ messages: chat?.messages || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const chat = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, history, tutorMode } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "A question is required" });
    }

    const context = await getContext(id, req.user.id);
    if (!context) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!context.text?.trim()) {
      return res.status(400).json({ message: "No readable text was found in this PDF" });
    }

    const savedChat = await Chat.findOne({
      userId: req.user.id,
      contextKey: context.contextKey,
    });
    const savedHistory = (savedChat?.messages || []).slice(-12).map((item) => ({
      role: item.role === "model" ? "model" : "user",
      parts: [{ text: item.text }],
    }));
    const modelHistory = Array.isArray(history) && history.length > 0 ? history : savedHistory;

    const response = await chatWithPDF(context.text, message.trim(), modelHistory, tutorMode || "Professor");

    await Chat.findOneAndUpdate(
      { userId: req.user.id, contextKey: context.contextKey },
      {
        $setOnInsert: {
          userId: req.user.id,
          contextKey: context.contextKey,
          pdfId: context.pdfId,
        },
        $push: {
          messages: {
            $each: [
              { role: "user", text: message.trim() },
              { role: "model", text: response },
            ],
            $slice: -50,
          },
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    const context = await getContext(req.params.id, req.user.id);
    if (!context) {
      return res.status(404).json({ message: "PDF not found" });
    }

    await Chat.findOneAndDelete({
      userId: req.user.id,
      contextKey: context.contextKey,
    });

    res.json({ message: "Chat history cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
