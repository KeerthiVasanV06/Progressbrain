import asyncHandler from "express-async-handler";
import Report from "../models/Report.js";
import StudySession from "../models/studySessionModel.js";
import Streak from "../models/streakModel.js";
import mongoose from "mongoose";

// --------------------------------------------------------
// Generate Weekly or Monthly Report
// @route POST /api/reports/generate/:type
// --------------------------------------------------------
export const generateReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const userId = req.user.id;

  // ----- Date Range -----
  const endDate = new Date();
  const startDate = new Date();

  if (type === "weekly") {
    startDate.setDate(endDate.getDate() - 7);
  } else {
    startDate.setMonth(endDate.getMonth() - 1);
  }

  // ----- Sessions -----
  const sessions = await StudySession.find({
    user: userId,
    startTime: { $gte: startDate, $lte: endDate },
    status: "completed",
  });

  if (sessions.length === 0) {
    return res.status(400).json({
      message: `No completed study sessions found for this ${type} period`,
    });
  }

  // ----- Calculations -----
  let totalStudyTime = 0;
  const subjectsBreakdown = {};

  sessions.forEach((session) => {
    totalStudyTime += session.actualTime;

    if (!subjectsBreakdown[session.subject]) {
      subjectsBreakdown[session.subject] = 0;
    }
    subjectsBreakdown[session.subject] += session.actualTime;
  });

  // ----- Streak -----
  const streakDoc = await Streak.findOne({ user: userId });

  // ----- Report Data -----
  const reportData = {
    user: userId,
    totalStudyTime,
    sessionsCompleted: sessions.length,
    subjectsBreakdown,
    streakAtGeneration: streakDoc ? streakDoc.currentStreak : 0,
    reportType: type,
    startDate,
    endDate,
  };

  const report = await Report.create(reportData);

  res.json({
    message: `${type} report generated successfully`,
    report,
    stats: {
      hours: (totalStudyTime / 60).toFixed(2),
      minutes: totalStudyTime,
      subjectsBreakdown,
      range: { startDate, endDate },
    },
  });
});

// --------------------------------------------------------
// Get all reports for logged-in user
// --------------------------------------------------------
export const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ user: req.user.id }).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    reports: reports,
  });
});

// --------------------------------------------------------
// Get report by ID
// --------------------------------------------------------
export const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Simple ObjectId validation
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid report ID" });
  }

  const report = await Report.findOne({
    _id: id,
    user: req.user.id,
  });

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  res.json(report);
});

// --------------------------------------------------------
// Delete report by ID
// --------------------------------------------------------
export const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Simple ObjectId validation
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid report ID" });
  }

  const report = await Report.findOne({
    _id: id,
    user: req.user.id,
  });

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  await Report.deleteOne({ _id: id });

  res.json({
    success: true,
    message: "Report deleted successfully",
  });
});
