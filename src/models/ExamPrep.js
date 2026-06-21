import mongoose from "mongoose";

const examPrepSchema = new mongoose.Schema(
  {
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
    mode: {
      type: String,
      enum: ["University", "Competitive", "Viva"],
      required: true,
    },
    data: {
      type: Object, // Stores twoMarkQuestions, fiveMarkQuestions, tenMarkQuestions, vivaQuestions, importantTopics, frequentConcepts
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ExamPrep", examPrepSchema);
