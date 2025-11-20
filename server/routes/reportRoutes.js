import express from "express";
import { generateReport, getReports, getReportById, deleteReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Validate report type (weekly, monthly, or custom)
const validateReportType = (req, res, next) => {
  const validTypes = ["weekly", "monthly", "custom"];
  const { type } = req.params;

  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid report type. Must be 'weekly', 'monthly', or 'custom'." });
  }

  next();
};

// Generate report (weekly, monthly, or custom)
router.post("/generate/:type", protect, validateReportType, generateReport);

// Get all reports for user
router.get("/", protect, getReports);

// Get report by ID
router.get("/:id", protect, getReportById);

// Delete report by ID
router.delete("/:id", protect, deleteReport);

export default router;
