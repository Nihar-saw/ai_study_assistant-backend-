import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
    },
    detectedTitle: { type: String },
    subject: { type: String },
    description: { type: String },
    keyTopics: [{ type: String }],
    suggestedQuestions: [{ type: String }],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    summary: { type: String },
    flashcards: { type: Array },
    quiz: { type: Array },
    resources: { type: Array },
  },
  {
    timestamps: true,
  }
);

const PDF = mongoose.model("PDF", pdfSchema);

export default PDF;
