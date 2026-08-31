const express = require("express");

const router = express.Router();

const calculateScheduleMetrics =
  require("../services/metricsService");


// GET schedule metrics

router.get("/", async (req, res) => {
  try {

    const result =
      await calculateScheduleMetrics();

    res.status(200).json(result);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,

      message:
        "Failed to calculate schedule metrics",

      error: error.message,
    });
  }
});


module.exports = router;