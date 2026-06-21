import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      required: true, // "quiz_completed", "flashcard_reviewed", "pdf_uploaded", "study_time", "interview_completed"
    },
    pdfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PDF",
    },
    score: {
      type: Number, // e.g. quiz score
    },
    maxScore: {
      type: Number,
    },
    studyDuration: {
      type: Number, // in seconds (for study_time activity)
    },
    topics: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ActivityLog", activityLogSchema);
