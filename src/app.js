import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

import authRoutes from "./routes/authRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode}`);
  });
  next();
});

// Static folder for PDF uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.send("AI Study Assistant API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/resources", resourceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

export default app;