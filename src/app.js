import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Static Uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Study Assistant API Running",
  });
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
  });
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

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  const status = err.name === "MulterError" || err.message === "Only PDF files are supported"
    ? 400
    : err.status || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
