import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: "",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pdfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PDF",
  },
  pinned: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model("Note", noteSchema);
