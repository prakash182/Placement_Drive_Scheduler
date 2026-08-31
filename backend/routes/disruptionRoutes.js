const express = require("express");

const router = express.Router();

const Disruption = require(
  "../models/Disruption"
);

const {
  processDisruption,
} = require(
  "../services/replanner"
);


// ============================================================
// CREATE AND PROCESS DISRUPTION
// ============================================================

router.post("/", async (req, res) => {
  try {
    const {
      type,
      company,
      student,
      panel,
      room,
      day,
      delayMinutes,
      reason,
    } = req.body;


    // --------------------------------------------------------
    // Validate disruption type.
    // --------------------------------------------------------

    const validTypes = [
      "COMPANY_DELAY",
      "PANEL_UNAVAILABLE",
      "STUDENT_WITHDRAWAL",
      "ROOM_UNAVAILABLE",
    ];


    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid disruption type",
      });
    }


    // --------------------------------------------------------
    // Create disruption record.
    // --------------------------------------------------------

    const disruption =
      await Disruption.create({
        type,

        company:
          company || null,

        student:
          student || null,

        panel:
          panel || null,

        room:
          room || null,

        day:
          day || null,

        delayMinutes:
          delayMinutes || 0,

        reason:
          reason || null,

        status:
          "pending",
      });


    // --------------------------------------------------------
    // Process disruption.
    // --------------------------------------------------------

    const result =
      await processDisruption(
        disruption
      );


    // --------------------------------------------------------
    // Mark processed.
    // --------------------------------------------------------

    disruption.status =
      "processed";

    await disruption.save();


    // --------------------------------------------------------
    // Response.
    // --------------------------------------------------------

    res.status(200).json({
      success: true,

      message:
        "Disruption processed successfully",

      disruption: {
        id: disruption._id,

        type:
          disruption.type,

        status:
          disruption.status,
      },

      result,
    });

  } catch (error) {

    console.error(
      "Disruption processing error:",
      error
    );


    res.status(500).json({
      success: false,

      message:
        "Failed to process disruption",

      error:
        error.message,
    });
  }
});


module.exports = router;