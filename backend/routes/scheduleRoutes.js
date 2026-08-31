const express = require("express");
const router = express.Router();

const generateSchedule = require("../services/scheduleGenerator");
const Interview = require("../models/Interview");

// Generate complete placement schedule
router.post("/generate", async (req, res) => {
  try {
    const result = await generateSchedule();

    res.status(201).json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to generate schedule",
      error: error.message,
    });
  }
});

// Get all interviews
router.get("/", async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate("student")
      .populate("company")
      .populate("room")
      .populate("panel")
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch schedules",
      error: error.message,
    });
  }
});

module.exports = router;