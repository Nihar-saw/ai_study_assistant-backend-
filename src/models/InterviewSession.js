import mongoose from "mongoose";

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pdfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PDF",
      required: true,
    },
    type: {
      type: String,
      enum: ["Technical", "HR", "Scenario", "Viva"],
      default: "Technical",
    },
    messages: [{
      role: { type: String, required: true }, // "interviewer" or "candidate"
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    evaluation: {
      score: { type: Number }, // 1-100 score
      feedback: { type: String },
      detailedEvaluation: { type: Object }, // Detail on strengths, weaknesses, tips
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("InterviewSession", interviewSessionSchema);
