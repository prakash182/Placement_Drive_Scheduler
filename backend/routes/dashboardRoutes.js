// backend/routes/dashboardRoutes.js

const express = require("express");

const router = express.Router();

const {
  getDashboardSummary,
  getUpcomingInterviews,
  getActiveDisruptions,
  getUnscheduledInterviews,
  getRecentChanges,
  getConflictSummary,
  getCompleteDashboard,
} = require("../services/dashboardService");


// ============================================================
// COMPLETE DASHBOARD
// ============================================================

router.get("/", async (req, res) => {
  try {

    const dashboard =
      await getCompleteDashboard();


    res.status(200).json({
      success: true,

      data: dashboard,
    });

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );


    res.status(500).json({
      success: false,

      message:
        "Failed to load dashboard",

      error:
        error.message,
    });
  }
});


// ============================================================
// SUMMARY
// ============================================================

router.get(
  "/summary",
  async (req, res) => {

    try {

      const summary =
        await getDashboardSummary();


      res.status(200).json({
        success: true,

        data: summary,
      });

    } catch (error) {

      res.status(500).json({
        success: false,

        message:
          "Failed to load dashboard summary",

        error:
          error.message,
      });
    }
  }
);


// ============================================================
// UPCOMING INTERVIEWS
// ============================================================

router.get(
  "/upcoming",
  async (req, res) => {

    try {

      const limit =
        req.query.limit || 20;


      const interviews =
        await getUpcomingInterviews(
          limit
        );


      res.status(200).json({
        success: true,

        count:
          interviews.length,

        data:
          interviews,
      });

    } catch (error) {

      res.status(500).json({
        success: false,

        message:
          "Failed to load upcoming interviews",

        error:
          error.message,
      });
    }
  }
);


// ============================================================
// DISRUPTIONS
// ============================================================

router.get(
  "/disruptions",
  async (req, res) => {

    try {

      const disruptions =
        await getActiveDisruptions();


      res.status(200).json({
        success: true,

        count:
          disruptions.length,

        data:
          disruptions,
      });

    } catch (error) {

      res.status(500).json({
        success: false,

        message:
          "Failed to load disruptions",

        error:
          error.message,
      });
    }
  }
);


// ============================================================
// UNSCHEDULED
// ============================================================

router.get(
  "/unscheduled",
  async (req, res) => {

    try {

      const interviews =
        await getUnscheduledInterviews();


      res.status(200).json({
        success: true,

        count:
          interviews.length,

        data:
          interviews,
      });

    } catch (error) {

      res.status(500).json({
        success: false,

        message:
          "Failed to load unscheduled interviews",

        error:
          error.message,
      });
    }
  }
);


// ============================================================
// RECENT CHANGES
// ============================================================

router.get(
  "/changes",
  async (req, res) => {

    try {

      const changes =
        await getRecentChanges();


      res.status(200).json({
        success: true,

        count:
          changes.length,

        data:
          changes,
      });

    } catch (error) {

      res.status(500).json({
        success: false,

        message:
          "Failed to load recent changes",

        error:
          error.message,
      });
    }
  }
);


// ============================================================
// CONFLICTS
// ============================================================

router.get(
  "/conflicts",
  async (req, res) => {

    try {

      const conflicts =
        await getConflictSummary();


      res.status(200).json({
        success: true,

        data:
          conflicts,
      });

    } catch (error) {

      res.status(500).json({
        success: false,

        message:
          "Failed to load conflicts",

        error:
          error.message,
      });
    }
  }
);


module.exports = router;