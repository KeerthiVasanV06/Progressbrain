import StudySession from "../models/studySessionModel.js";
import Report from "../models/Report.js";
import Streak from "../models/streakModel.js";
import asyncHandler from "express-async-handler";
import moment from "moment";

// ============================
//  START STUDY SESSION
// ============================
export const startSession = asyncHandler(async (req, res) => {
  const { subject, topic, plannedDuration } = req.body;

  if (!subject || !topic || !plannedDuration) {
    res.status(400);
    throw new Error("Please provide subject, topic, and plannedDuration");
  }

  if (typeof plannedDuration !== "number" || plannedDuration < 1) {
    res.status(400);
    throw new Error("Planned duration must be a positive number (in seconds)");
  }

  const session = await StudySession.create({
    user: req.user.id,
    subject,
    topic,
    plannedDuration,
    status: "active",
  });

  res.status(201).json({
    success: true,
    message: "Study session started",
    session,
  });
});

// ============================
//  END STUDY SESSION
// ============================
export const endSession = asyncHandler(async (req, res) => {
  const { sessionId, elapsedTime } = req.body;
  
  console.log(`[endSession] Called: sessionId=${sessionId}, elapsedTime=${elapsedTime}, userId=${req.user?.id}`);

  if (!sessionId) {
    res.status(400);
    throw new Error("Please provide sessionId");
  }

  const session = await StudySession.findById(sessionId);
  console.log(`[endSession] Session found: ${session ? session._id : "NOT FOUND"}`);

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  if (session.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to end this session");
  }

  session.endTime = new Date();
  session.actualDuration = elapsedTime || 0;
  session.status = "completed";

  await session.save();
// ============================
//     FIXED STREAK LOGIC
// ============================

// Use consistent local day (e.g., Asia/Kolkata)
const zone = "+05:30";
const today = moment().utcOffset(zone).format("YYYY-MM-DD");
const yesterday = moment().utcOffset(zone).subtract(1, "day").format("YYYY-MM-DD");

console.log(`[endSession] Streak update: today="${today}", yesterday="${yesterday}", userId=${session.user}`);

let streak = await Streak.findOne({ user: session.user });
console.log(`[endSession] Found existing streak:`, streak ? `currentStreak=${streak.currentStreak}, lastActiveDate=${streak.lastActiveDate}` : "None");

if (!streak) {
  streak = await Streak.create({
    user: session.user,
    lastActiveDate: today,
    currentStreak: 1,
    highestStreak: 1,
  });
  console.log(`[endSession] Created new streak: currentStreak=1, lastActiveDate=${today}`);
} else {
  // lastActiveDate is already stored as "YYYY-MM-DD" string, compare directly
  const last = streak.lastActiveDate;
  console.log(`[endSession] Comparing: last="${last}" vs today="${today}"`);

  if (last !== today) {
    console.log(`[endSession] Date changed, updating streak...`);
    if (last === yesterday) {
      streak.currentStreak += 1;
      console.log(`[endSession] Yesterday matched! Incremented streak to ${streak.currentStreak}`);
    } else {
      streak.currentStreak = 1;
      console.log(`[endSession] Missed a day, reset streak to 1`);
    }

    streak.lastActiveDate = today;

    if (streak.currentStreak > streak.highestStreak) {
      streak.highestStreak = streak.currentStreak;
      console.log(`[endSession] Updated highest streak to ${streak.highestStreak}`);
    }

    await streak.save();
    console.log(`[endSession] Streak saved: currentStreak=${streak.currentStreak}, highestStreak=${streak.highestStreak}`);
  } else {
    console.log(`[endSession] Same day, no streak update needed`);
  }
}


  // ✅ If session has notes, create a report from them
  if (session.notes && session.notes.trim() !== "") {
    console.log(`[endSession] Creating report from session notes. sessionId=${sessionId}`);
    
    const reportData = {
      user: session.user,
      sessionId: session._id,
      title: `${session.subject} - ${session.topic}`,
      content: session.notes,
      reportType: "session",
      generatedAt: new Date(),
    };

    const report = await Report.create(reportData);
    console.log(`[endSession] Report created: ${report._id}`);
  }

  res.status(200).json({
    success: true,
    message: "Session ended successfully",
    session,
    streak: {
      currentStreak: streak.currentStreak,
      highestStreak: streak.highestStreak,
    },
  });
});

// ============================
//  GET ALL SESSIONS FOR USER
// ============================
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await StudySession.find({ user: req.user.id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: sessions.length,
    sessions,
  });
});

// ============================
//  SAVE REPORT / NOTES
// ============================
export const saveReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  console.log(`[saveReport] Received: id=${id}, notes=${notes}, userId=${req.user?.id}`);

  if (!notes || notes.trim() === "") {
    console.log(`[saveReport] Error: Notes are empty`);
    res.status(400);
    throw new Error("Report text is required");
  }

  const session = await StudySession.findById(id);
  console.log(`[saveReport] Found session:`, session ? `id=${session._id}` : "NOT FOUND");

  if (!session) {
    console.log(`[saveReport] Error: Session not found with id=${id}`);
    res.status(404);
    throw new Error("Study session not found");
  }

  if (session.user.toString() !== req.user.id) {
    console.log(`[saveReport] Error: Authorization failed. Session userId=${session.user}, User id=${req.user.id}`);
    res.status(403);
    throw new Error("Not authorized to save report for this session");
  }

  console.log(`[saveReport] Before save: session.notes="${session.notes}"`);
  session.notes = notes;
  console.log(`[saveReport] After assignment: session.notes="${session.notes}"`);
  
  const savedSession = await session.save();
  console.log(`[saveReport] After save(): savedSession.notes="${savedSession.notes}"`);

  // Verify notes were actually saved by fetching from DB
  const verifySession = await StudySession.findById(id);
  console.log(`[saveReport] Verification from DB: notes="${verifySession.notes}"`);

  res.status(200).json({
    success: true,
    message: "Report saved successfully",
    session: savedSession,
  });
});

// ============================
//  GET SINGLE SESSION
// ============================
export const getSession = asyncHandler(async (req, res) => {
  const session = await StudySession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  if (session.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to view this session");
  }

  res.status(200).json({
    success: true,
    session,
  });
});

// ============================
//  DELETE SESSION
// ============================
export const deleteSession = asyncHandler(async (req, res) => {
  const session = await StudySession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  if (session.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to delete this session");
  }

  await session.deleteOne();

  res.status(200).json({
    success: true,
    message: "Session deleted successfully",
  });
});
