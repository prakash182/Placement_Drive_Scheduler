const express = require("express");

const router = express.Router();

const calculateReplanningChurn =
  require("../services/churnService");


router.get("/", async (req, res) => {
  try {

    const result =
      await calculateReplanningChurn();

    res.status(200).json(result);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,

      message:
        "Failed to calculate replanning churn",

      error: error.message,
    });
  }
});


module.exports = router;