import mongoose from "mongoose";

const revisionSchema = new mongoose.Schema({
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
  topic: {
    type: String,
    required: true,
  },
  dueTime: {
    type: Date,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  }
}, { timestamps: true });

export default mongoose.model("Revision", revisionSchema);
