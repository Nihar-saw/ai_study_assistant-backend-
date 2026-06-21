import mongoose from "mongoose";

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    examDate: {
      type: Date,
      required: true,
    },
    subjects: [{
      type: String,
    }],
    dailyStudyHours: {
      type: Number,
      required: true,
    },
    planData: {
      type: Object, // Stores structured dailyPlan, weeklyPlan, revisionSchedule
      required: true,
    },
    completedTasks: [{
      type: String, // String IDs of completed tasks, e.g. "Day 1 - DBMS SQL"
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("StudyPlan", studyPlanSchema);
