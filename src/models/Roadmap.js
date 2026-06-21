import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema(
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
    topics: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      parent: { type: String, default: null },
      isCompleted: { type: Boolean, default: false },
      keyConcepts: [{ type: String }],
    }],
    progress: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Roadmap", roadmapSchema);
