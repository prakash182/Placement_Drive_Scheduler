const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    panel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Panel",
      required: true,
    },

    day: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "unscheduled"],
      default: "scheduled",
    },

    version: {
      type: Number,
      default: 1,
    },

    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Interview", interviewSchema);