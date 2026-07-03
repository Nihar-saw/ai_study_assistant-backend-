import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contextKey: {
      type: String,
      required: true,
    },
    pdfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PDF",
      default: null,
    },
    messages: [{
      role: {
        type: String,
        enum: ["user", "model"],
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, contextKey: 1 }, { unique: true });

export default mongoose.model("Chat", chatSchema);
