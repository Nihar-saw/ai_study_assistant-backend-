import mongoose from "mongoose";

const weaknessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weakTopics: [{
      topic: { type: String, required: true },
      score: { type: Number, default: 0 }, // Lower scores mean higher weakness
      attempts: { type: Number, default: 0 },
      incorrectCount: { type: Number, default: 0 },
      lastTested: { type: Date, default: Date.now },
    }],
    recommendations: [{
      topic: { type: String },
      text: { type: String },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Weakness", weaknessSchema);
