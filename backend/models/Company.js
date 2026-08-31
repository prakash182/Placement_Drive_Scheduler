const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    priorityTier: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },

    cgpaCutoff: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },

    interviewDuration: {
      type: Number,
      required: true,
      min: 15,
    },

    availableDays: [
      {
        type: Number,
        min: 1,
        max: 4,
      },
    ],

    arrivalTime: {
      type: String,
      default: "09:00",
    },

    status: {
      type: String,
      enum: ["active", "delayed", "completed", "cancelled"],
      default: "active",
    },

    shortlistCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Company", companySchema);