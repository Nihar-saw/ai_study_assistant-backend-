import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema({
  pdfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PDF",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("Flashcard", flashcardSchema);
