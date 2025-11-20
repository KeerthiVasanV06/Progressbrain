import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      required: [true, 'Please provide a subject'],
      trim: true,
    },

    topic: {
      type: String,
      required: [true, 'Please provide a topic'],
      trim: true,
    },

    plannedDuration: {
      type: Number,
      required: [true, 'Please provide planned duration'],
      min: 1,
    },

    actualDuration: {
      type: Number,
      default: 0,
    },

    startTime: {
      type: Date,
      default: Date.now,
    },

    endTime: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

studySessionSchema.index({ user: 1, createdAt: -1 });

const StudySession = mongoose.model("StudySession", studySessionSchema);
export default StudySession;
