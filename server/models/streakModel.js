import mongoose from "mongoose";

const streakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // MUST be string to avoid timezone issues
    lastActiveDate: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },

    currentStreak: {
      type: Number,
      default: 1,
    },

    highestStreak: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

streakSchema.pre("save", function (next) {
  if (this.currentStreak > this.highestStreak) {
    this.highestStreak = this.currentStreak;
  }
  next();
});

export default mongoose.model("Streak", streakSchema);
