import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { updateStreak, getStreakInfo } from "../controllers/streakController.js";

const router = express.Router();

// @route   PUT /api/streak/update
// @desc    Update streak when user finishes a study session
// @access  Private
router.put("/update", protect, updateStreak);

// @route   GET /api/streak
// @desc    Get current streak + highest streak
// @access  Private
router.get("/", protect, getStreakInfo);

export default router;
