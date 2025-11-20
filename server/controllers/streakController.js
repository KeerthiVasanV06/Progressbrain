import Streak from "../models/streakModel.js";
import moment from "moment";

// ------------------------------------------------------------
// Helper: returns today's and yesterday's date as YYYY-MM-DD
// ------------------------------------------------------------
const getDates = () => {
  const today = moment().utcOffset("+05:30").format("YYYY-MM-DD");
  const yesterday = moment().utcOffset("+05:30").subtract(1, "day").format("YYYY-MM-DD");
  return { today, yesterday };
};

// ------------------------------------------------------------
// POST /api/streak/update
// Updates or creates a user streak
// ------------------------------------------------------------
export const updateStreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const { today, yesterday } = getDates();

    let streak = await Streak.findOne({ user: userId });

    // If no streak exists yet → create first record
    if (!streak) {
      const newStreak = await Streak.create({
        user: userId,
        lastActiveDate: today,
        currentStreak: 1,
        highestStreak: 1,
      });

      return res.status(201).json({
        success: true,
        message: "New streak started.",
        streak: newStreak,
      });
    }

    // If streak updated today → do nothing
    if (streak.lastActiveDate === today) {
      return res.status(200).json({
        success: true,
        message: "Streak already updated today.",
        streak,
      });
    }

    // Continue streak if yesterday matches
    if (streak.lastActiveDate === yesterday) {
      streak.currentStreak += 1;
    } else {
      // Missed a day → reset
      streak.currentStreak = 1;
    }

    // Update highest streak
    if (streak.currentStreak > streak.highestStreak) {
      streak.highestStreak = streak.currentStreak;
    }

    streak.lastActiveDate = today;
    await streak.save();

    res.status(200).json({
      success: true,
      message: "Streak updated successfully.",
      streak,
    });

  } catch (error) {
    console.error("Update streak error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating streak",
      error: error.message,
    });
  }
};

// ------------------------------------------------------------
// GET /api/streak
// Returns user streak info
// ------------------------------------------------------------
export const getStreakInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    let streak = await Streak.findOne({ user: userId });

    if (!streak) {
      return res.status(200).json({
        success: true,
        streak: {
          currentStreak: 0,
          highestStreak: 0,
          lastActiveDate: null,
        },
      });
    }

    res.status(200).json({
      success: true,
      streak,
    });

  } catch (error) {
    console.error("Get streak error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching streak information",
      error: error.message,
    });
  }
};
