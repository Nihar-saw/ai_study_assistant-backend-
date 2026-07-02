import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import roadmapRoutes from "./routes/roadmapRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import mindMapRoutes from "./routes/mindMapRoutes.js";
import studyPlannerRoutes from "./routes/studyPlannerRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import weaknessRoutes from "./routes/weaknessRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import revisionRoutes from "./routes/revisionRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  "https://ai-study-assistant-pearl.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.options("*", cors());

// Database connection middleware (ensures DB is connected before processing requests)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err);
    res.status(500).json({ error: "Failed to connect to the database" });
  }
});

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
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/mindmap", mindMapRoutes);
app.use("/api/planner", studyPlannerRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/weakness", weaknessRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/revision", revisionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

export default app;