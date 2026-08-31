// backend/routes/lookupRoutes.js
//
// Lightweight list endpoints used by the coordinator dashboard to
// populate the disruption-trigger dropdowns (pick a company, one of
// its panels, a room, a student). These were missing entirely, which
// meant there was no way for the frontend to know which IDs exist —
// requirement #4 (one-click replan) had no data to work with.

const express = require("express");
const router = express.Router();

const Company = require("../models/Company");
const Panel = require("../models/Panel");
const Room = require("../models/Room");
const Student = require("../models/Student");

// GET /api/lookup/companies
router.get("/companies", async (req, res) => {
  try {
    const companies = await Company.find({})
      .select("name priorityTier status availableDays arrivalTime")
      .sort({ priorityTier: 1, name: 1 });

    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load companies",
      error: error.message,
    });
  }
});

// GET /api/lookup/panels?company=<companyId>
router.get("/panels", async (req, res) => {
  try {
    const filter = {};

    if (req.query.company) {
      filter.company = req.query.company;
    }

    const panels = await Panel.find(filter)
      .select("panelId company status")
      .sort({ panelId: 1 });

    res.status(200).json({ success: true, data: panels });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load panels",
      error: error.message,
    });
  }
});

// GET /api/lookup/rooms
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({})
      .select("roomNumber available")
      .sort({ roomNumber: 1 });

    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load rooms",
      error: error.message,
    });
  }
});

// GET /api/lookup/students?company=<companyId>&search=<text>
router.get("/students", async (req, res) => {
  try {
    const filter = { status: "active" };

    if (req.query.company) {
      filter.shortlistedCompanies = req.query.company;
    }

    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, "i") },
        { studentId: new RegExp(req.query.search, "i") },
      ];
    }

    const students = await Student.find(filter)
      .select("studentId name branch cgpa status")
      .sort({ studentId: 1 })
      .limit(50);

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load students",
      error: error.message,
    });
  }
});

module.exports = router;
