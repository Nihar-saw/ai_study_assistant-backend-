import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
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
  options: [{
    type: String,
    required: true,
  }],
  correctAnswer: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
