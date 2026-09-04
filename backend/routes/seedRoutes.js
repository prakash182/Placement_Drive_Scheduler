const express = require("express");
const router = express.Router();

const generateData = require("../services/dataGenerator");

router.get("/", async (req, res) => {
  try {
    const data = await generateData();

    res.status(201).json({
      success: true,
      message: "Placement data generated successfully",
      counts: {
        companies: data.companies.length,
        students: data.students.length,
        rooms: data.rooms.length,
        panels: data.panels.length,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to generate data",
      error: error.message,
    });
  }
});

module.exports = router;