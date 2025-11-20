import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";

import reportRoutes from "./routes/reportRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import studySessionRoutes from "./routes/studySessionRoutes.js";
import streakRoutes from "./routes/streakRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();
connectDB();

const app = express();

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  })
);

// Helmet (secure headers)
app.use(
  helmet({
    crossOriginResourcePolicy: false, // needed for uploaded files to load
  })
);

// Logger
app.use(morgan("dev"));

// Static uploads
app.use("/uploads", express.static("uploads"));

// Root
app.get("/", (req, res) => {
  res.send("Progress Brain API is running...");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/study-sessions", studySessionRoutes);

app.use("/api/streak", streakRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatbotRoutes);

// 404 fallback (must be before error handler)
app.use((req, res, next) => {
  console.log(`[404 HANDLER] ${req.method} ${req.originalUrl}`);
  if (!res.headersSent) {
    res.status(404).json({ message: "Route not found", method: req.method, url: req.originalUrl });
  }
});

// Error handler (MUST be last - 4 parameters required for Express to recognize it as error middleware)
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER] Error:', err.message, err.stack);
  if (!res.headersSent) {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  }
});

const PORT = process.env.PORT || 5000;

// Catch unhandled rejections BEFORE starting server
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
