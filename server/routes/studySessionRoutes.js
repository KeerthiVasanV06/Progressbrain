import express from "express";
import {
  startSession,
  endSession,
  getSessions,
  getSession,
  deleteSession,
  saveReport,
} from "../controllers/studySessionController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Start Session ---
router.post("/start", protect, startSession);

// --- End Session ---
router.patch("/end", protect, endSession);

// --- Get all user sessions ---
router.get("/", protect, getSessions);

// IMPORTANT: this MUST be before "/:id"
router.patch("/:id/report", protect, saveReport);

// --- Get single session ---
router.get("/:id", protect, getSession);

// --- Delete session ---
router.delete("/:id", protect, deleteSession);

export default router;
