import Streak from "../models/streakModel.js";
import moment from "moment";

export const updateUserStreak = async (userId) => {
  // Use consistent timezone (Asia/Kolkata)
  const zone = "+05:30";
  const today = moment().utcOffset(zone).format("YYYY-MM-DD");
  const yesterday = moment().utcOffset(zone).subtract(1, "day").format("YYYY-MM-DD");

  let streak = await Streak.findOne({ user: userId });

  // If no streak exists → create one
  if (!streak) {
    streak = await Streak.create({
      user: userId,
      lastActiveDate: today,
      currentStreak: 1,
      highestStreak: 1,
    });

    return streak;
  }

  // Compare dates as strings (YYYY-MM-DD format)
  const lastActive = streak.lastActiveDate;

  // Already updated today → do nothing
  if (lastActive === today) {
    return streak;
  }

  // Yesterday → increase streak
  if (lastActive === yesterday) {
    streak.currentStreak += 1;
  } else {
    // Missed a day → reset
    streak.currentStreak = 1;
  }

  // Update highest streak automatically
  if (streak.currentStreak > streak.highestStreak) {
    streak.highestStreak = streak.currentStreak;
  }

  // Save updated date
  streak.lastActiveDate = today;

  await streak.save();
  return streak;
};
