import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // For session-based reports
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudySession",
      default: null,
    },

    title: {
      type: String,
      default: null,
    },

    content: {
      type: String,
      default: null,
    },

    // For weekly/monthly aggregated reports
    totalStudyTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    sessionsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },

    subjectsBreakdown: {
      type: Map,
      of: Number,
      default: () => ({}),
    },

    streakAtGeneration: {
      type: Number,
      default: 0,
      min: 0,
    },

    reportType: {
      type: String,
      enum: ["session", "weekly", "monthly", "custom"],
      default: "session",
      required: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Validation
reportSchema.pre("save", function (next) {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    return next(new Error("endDate must be greater than startDate"));
  }
  next();
});

// Helpful indexes
reportSchema.index({ user: 1, reportType: 1, startDate: 1, endDate: 1 });
reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ sessionId: 1 });

export default mongoose.model("Report", reportSchema);
