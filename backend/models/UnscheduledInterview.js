const mongoose = require("mongoose");

const unscheduledInterviewSchema = new mongoose.Schema(
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

    reason: {
      type: String,
      required: true,
    },

    dayAttempted: {
      type: [Number],
      default: [],
    },

    status: {
      type: String,
      enum: ["unscheduled", "resolved"],
      default: "unscheduled",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "UnscheduledInterview",
  unscheduledInterviewSchema
);