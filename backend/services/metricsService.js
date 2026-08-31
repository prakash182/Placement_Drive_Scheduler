const Interview = require("../models/Interview");
const UnscheduledInterview = require(
  "../models/UnscheduledInterview"
);
const Room = require("../models/Room");
const Panel = require("../models/Panel");


// ============================================================
// TIME HELPERS
// ============================================================

const timeToMinutes = (time) => {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
};


// ============================================================
// CALCULATE INTERVIEW DURATION
// ============================================================

const calculateDuration = (
  startTime,
  endTime
) => {
  return (
    timeToMinutes(endTime) -
    timeToMinutes(startTime)
  );
};


// ============================================================
// MAIN METRICS FUNCTION
// ============================================================

const calculateScheduleMetrics = async () => {

  // ----------------------------------------------------------
  // FETCH DATA
  // ----------------------------------------------------------

  // Only interviews that are still actually on the schedule
  // should feed utilization / waiting-time math. Cancelled and
  // unscheduled interviews would otherwise inflate "scheduled"
  // counts and drag stale times into the utilization figures.

  const interviews = await Interview.find({
    status: "scheduled",
  });

  const unscheduledFromReplan =
    await Interview.find({
      status: "unscheduled",
    });

  const unscheduled =
    await UnscheduledInterview.find({});

  const rooms = await Room.find({});

  const panels = await Panel.find({});


  // ----------------------------------------------------------
  // BASIC COUNTS
  // ----------------------------------------------------------

  const scheduledCount =
    interviews.length;

  const unscheduledCount =
    unscheduled.length +
    unscheduledFromReplan.length;

  const totalInterviews =
    scheduledCount +
    unscheduledCount;


  // ----------------------------------------------------------
  // SUCCESS RATE
  // ----------------------------------------------------------

  const schedulingSuccess =
    totalInterviews > 0
      ? Number(
          (
            (scheduledCount /
              totalInterviews) *
            100
          ).toFixed(2)
        )
      : 0;


  // ----------------------------------------------------------
  // TOTAL INTERVIEW MINUTES
  // ----------------------------------------------------------

  let totalInterviewMinutes = 0;

  interviews.forEach((interview) => {
    totalInterviewMinutes +=
      calculateDuration(
        interview.startTime,
        interview.endTime
      );
  });


  // ----------------------------------------------------------
  // ROOM UTILIZATION
  // ----------------------------------------------------------

  const workingMinutes =
    (17 - 9) * 60;

  const totalRoomCapacity =
    rooms.length *
    workingMinutes *
    4;

  const roomUtilization =
    totalRoomCapacity > 0
      ? Number(
          (
            (totalInterviewMinutes /
              totalRoomCapacity) *
            100
          ).toFixed(2)
        )
      : 0;


  // ----------------------------------------------------------
  // PANEL UTILIZATION
  // ----------------------------------------------------------

  const totalPanelCapacity =
    panels.length *
    workingMinutes *
    4;

  const panelUtilization =
    totalPanelCapacity > 0
      ? Number(
          (
            (totalInterviewMinutes /
              totalPanelCapacity) *
            100
          ).toFixed(2)
        )
      : 0;


  // ----------------------------------------------------------
  // STUDENT WAITING TIME
  // ----------------------------------------------------------

  // Waiting time means the time between a student's
  // consecutive interviews.

  const studentSchedules = {};

  interviews.forEach((interview) => {

    const studentId =
      interview.student.toString();

    if (!studentSchedules[studentId]) {
      studentSchedules[studentId] = [];
    }

    studentSchedules[studentId].push(
      interview
    );
  });


  let totalWaitingMinutes = 0;

  let waitingPeriods = 0;


  Object.values(studentSchedules).forEach(
    (studentInterviews) => {

      // Sort by day and start time.

      studentInterviews.sort(
        (a, b) => {
          if (a.day !== b.day) {
            return a.day - b.day;
          }

          return (
            timeToMinutes(a.startTime) -
            timeToMinutes(b.startTime)
          );
        }
      );


      for (
        let i = 1;
        i < studentInterviews.length;
        i++
      ) {

        const previous =
          studentInterviews[i - 1];

        const current =
          studentInterviews[i];


        // If interviews are on different days,
        // don't count overnight time.

        if (
          previous.day !==
          current.day
        ) {
          continue;
        }


        const previousEnd =
          timeToMinutes(
            previous.endTime
          );

        const currentStart =
          timeToMinutes(
            current.startTime
          );


        const waiting =
          currentStart -
          previousEnd;


        if (waiting > 0) {
          totalWaitingMinutes +=
            waiting;

          waitingPeriods++;
        }
      }
    }
  );


  const averageStudentWaitingTime =
    waitingPeriods > 0
      ? Number(
          (
            totalWaitingMinutes /
            waitingPeriods
          ).toFixed(2)
        )
      : 0;


  // ----------------------------------------------------------
  // UNSCHEDULED REASONS
  // ----------------------------------------------------------

  const failureReasons = {};

  unscheduled.forEach((item) => {

    const reason = item.reason;

    if (!failureReasons[reason]) {
      failureReasons[reason] = 0;
    }

    failureReasons[reason]++;
  });

  unscheduledFromReplan.forEach((item) => {

    const reason =
      item.cancellationReason ||
      "Unscheduled during replan";

    if (!failureReasons[reason]) {
      failureReasons[reason] = 0;
    }

    failureReasons[reason]++;
  });


  // ----------------------------------------------------------
  // RETURN METRICS
  // ----------------------------------------------------------

  return {
    success: true,

    metrics: {
      totalInterviews,

      scheduledInterviews:
        scheduledCount,

      unscheduledInterviews:
        unscheduledCount,

      schedulingSuccessPercentage:
        schedulingSuccess,

      totalInterviewMinutes,

      roomUtilizationPercentage:
        roomUtilization,

      panelUtilizationPercentage:
        panelUtilization,

      averageStudentWaitingTimeMinutes:
        averageStudentWaitingTime,

      failureReasons,
    },
  };
};


module.exports =
  calculateScheduleMetrics;