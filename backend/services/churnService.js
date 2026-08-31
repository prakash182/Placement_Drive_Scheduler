// backend/services/churnService.js

const Disruption = require("../models/Disruption");


// ============================================================
// CALCULATE REPLANNING CHURN
// ============================================================

const calculateReplanningChurn = async () => {

  const disruptions = await Disruption.find({});


  let totalAffected = 0;
  let totalChanged = 0;
  let totalCancelled = 0;


  const disruptionSummary = [];


  // ----------------------------------------------------------
  // PROCESS EACH DISRUPTION
  // ----------------------------------------------------------

  for (const disruption of disruptions) {

    // We currently store the basic disruption information.
    // The actual affected/changed counts are derived from
    // the processed disruption result when available.

    disruptionSummary.push({
      disruptionId:
        disruption._id,

      type:
        disruption.type,

      status:
        disruption.status,

      reason:
        disruption.reason,
    });
  }


  // ----------------------------------------------------------
  // FIND INTERVIEWS THAT WERE REPLANNED
  // ----------------------------------------------------------

  const Interview =
    require("../models/Interview");

  const interviews =
    await Interview.find({});


  interviews.forEach((interview) => {

    // version > 1 means this interview was changed
    // after the initial schedule.

    if (
      interview.version &&
      interview.version > 1
    ) {
      totalChanged++;
    }

    if (
      interview.status === "cancelled" ||
      interview.status === "unscheduled"
    ) {
      totalCancelled++;
    }
  });


  // ----------------------------------------------------------
  // ESTIMATE AFFECTED INTERVIEWS
  // ----------------------------------------------------------

  // Every changed interview was definitely affected.
  // Cancelled/unscheduled interviews are also affected.

  totalAffected =
    totalChanged +
    totalCancelled;


  // ----------------------------------------------------------
  // CHURN PERCENTAGE
  // ----------------------------------------------------------

  const churnPercentage =
    totalAffected > 0
      ? Number(
          (
            (totalChanged /
              totalAffected) *
            100
          ).toFixed(2)
        )
      : 0;


  // ----------------------------------------------------------
  // RETURN RESULT
  // ----------------------------------------------------------

  return {
    success: true,

    metrics: {

      totalAffectedInterviews:
        totalAffected,

      totalChangedInterviews:
        totalChanged,

      totalCancelledInterviews:
        totalCancelled,

      replanningChurnPercentage:
        churnPercentage,
    },

    disruptions:
      disruptionSummary,
  };
};


module.exports =
  calculateReplanningChurn;