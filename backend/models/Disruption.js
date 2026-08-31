// backend/models/Disruption.js

const mongoose = require("mongoose");

const disruptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "COMPANY_DELAY",
        "PANEL_UNAVAILABLE",
        "STUDENT_WITHDRAWAL",
        "ROOM_UNAVAILABLE",
      ],
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    panel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Panel",
      default: null,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    // Used mainly for company delay.
    day: {
      type: Number,
      min: 1,
      max: 4,
      default: null,
    },

    delayMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    reason: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "processed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Disruption",
  disruptionSchema
);