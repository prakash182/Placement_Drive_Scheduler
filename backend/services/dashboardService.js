// backend/services/dashboardService.js

const Company = require("../models/Company");
const Student = require("../models/Student");
const Room = require("../models/Room");
const Panel = require("../models/Panel");
const Interview = require("../models/Interview");
const Disruption = require("../models/Disruption");
const UnscheduledInterview = require("../models/UnscheduledInterview");


// ============================================================
// DASHBOARD SUMMARY
// ============================================================

const getDashboardSummary = async () => {
  const [
    totalStudents,
    totalCompanies,
    totalRooms,
    totalPanels,

    scheduledInterviews,
    unscheduledFromReplan,
    unscheduledFromGeneration,
    cancelledInterviews,

    availableRooms,
    availablePanels,
  ] = await Promise.all([
    Student.countDocuments(),

    Company.countDocuments(),

    Room.countDocuments(),

    Panel.countDocuments(),

    Interview.countDocuments({
      status: "scheduled",
    }),

    Interview.countDocuments({
      status: "unscheduled",
    }),

    UnscheduledInterview.countDocuments({
      status: "unscheduled",
    }),

    Interview.countDocuments({
      status: "cancelled",
    }),

    Room.countDocuments({
      available: true,
    }),

    Panel.countDocuments({
      status: "available",
    }),
  ]);


  const unscheduledInterviews =
    unscheduledFromReplan +
    unscheduledFromGeneration;

  const totalInterviews =
    scheduledInterviews +
    unscheduledInterviews +
    cancelledInterviews;


  const schedulingSuccessRate =
    totalInterviews > 0
      ? Number(
          (
            (scheduledInterviews /
              totalInterviews) *
            100
          ).toFixed(2)
        )
      : 0;


  const roomUtilization =
    totalRooms > 0
      ? Number(
          (
            ((totalRooms -
              availableRooms) /
              totalRooms) *
            100
          ).toFixed(2)
        )
      : 0;


  const panelUtilization =
    totalPanels > 0
      ? Number(
          (
            ((totalPanels -
              availablePanels) /
              totalPanels) *
            100
          ).toFixed(2)
        )
      : 0;


  return {
    students: totalStudents,

    companies: totalCompanies,

    rooms: totalRooms,

    panels: totalPanels,

    interviews: {
      total: totalInterviews,

      scheduled:
        scheduledInterviews,

      unscheduled:
        unscheduledInterviews,

      cancelled:
        cancelledInterviews,
    },

    schedulingSuccessRate,

    roomUtilization,

    panelUtilization,
  };
};


// ============================================================
// UPCOMING INTERVIEWS
// ============================================================

const getUpcomingInterviews = async (
  limit = 20
) => {

  const interviews =
    await Interview.find({
      status: "scheduled",
    })
      .populate(
        "student",
        "name studentId cgpa branch"
      )
      .populate(
        "company",
        "name priorityTier"
      )
      .populate(
        "room",
        "roomNumber capacity"
      )
      .populate(
        "panel",
        "panelId"
      )
      .sort({
        day: 1,
        startTime: 1,
      })
      .limit(Number(limit));


  return interviews;
};


// ============================================================
// ACTIVE DISRUPTIONS
// ============================================================

const getActiveDisruptions = async () => {

  const disruptions =
    await Disruption.find({
      status: {
        $in: [
          "pending",
          "processed",
        ],
      },
    })
      .populate(
        "company",
        "name priorityTier"
      )
      .populate(
        "student",
        "name studentId"
      )
      .populate(
        "panel",
        "panelId"
      )
      .populate(
        "room",
        "roomNumber"
      )
      .sort({
        createdAt: -1,
      })
      .limit(20);


  return disruptions;
};


// ============================================================
// UNSCHEDULED INTERVIEWS
// ============================================================

// Unscheduled interviews live in TWO places:
//
// 1. UnscheduledInterview collection — students who never got a
//    slot during the initial schedule generation.
// 2. Interview docs with status "unscheduled" — interviews that
//    WERE scheduled but got knocked out during a replan (delay,
//    panel/room dropping out) and no replacement slot was found.
//
// The coordinator needs to see both, or "what could not be
// scheduled and why" is silently incomplete.

const getUnscheduledInterviews =
  async () => {

    const [
      replanFailures,
      initialGenerationFailures,
    ] = await Promise.all([
      Interview.find({
        status: "unscheduled",
      })
        .populate(
          "student",
          "name studentId cgpa branch"
        )
        .populate(
          "company",
          "name priorityTier"
        )
        .sort({
          updatedAt: -1,
        }),

      UnscheduledInterview.find({
        status: "unscheduled",
      })
        .populate(
          "student",
          "name studentId cgpa branch"
        )
        .populate(
          "company",
          "name priorityTier"
        )
        .sort({
          createdAt: -1,
        }),
    ]);


    const fromReplan = replanFailures.map(
      (interview) => ({
        _id: interview._id,
        source: "replan",
        student: interview.student,
        company: interview.company,
        day: interview.day,
        reason:
          interview.cancellationReason ||
          "Could not be rescheduled after a disruption",
      })
    );

    const fromInitialGeneration =
      initialGenerationFailures.map(
        (item) => ({
          _id: item._id,
          source: "initial-generation",
          student: item.student,
          company: item.company,
          day: null,
          reason: item.reason,
        })
      );

    return [
      ...fromReplan,
      ...fromInitialGeneration,
    ];
  };


// ============================================================
// RECENT REPLANNING CHANGES
// ============================================================

const getRecentChanges = async () => {

  const interviews =
    await Interview.find({
      version: {
        $gt: 1,
      },
    })
      .populate(
        "student",
        "name studentId"
      )
      .populate(
        "company",
        "name"
      )
      .populate(
        "room",
        "roomNumber"
      )
      .populate(
        "panel",
        "panelId"
      )
      .sort({
        updatedAt: -1,
      })
      .limit(30);


  return interviews.map(
    (interview) => ({
      interviewId:
        interview._id,

      student:
        interview.student,

      company:
        interview.company,

      day:
        interview.day,

      startTime:
        interview.startTime,

      endTime:
        interview.endTime,

      room:
        interview.room,

      panel:
        interview.panel,

      status:
        interview.status,

      version:
        interview.version,

      cancellationReason:
        interview.cancellationReason || null,

      updatedAt:
        interview.updatedAt,
    })
  );
};


// ============================================================
// CONFLICT SUMMARY
// ============================================================

const getConflictSummary = async () => {

  const [
    unscheduledFromReplan,
    unscheduledFromGeneration,
    cancelled,
    pendingDisruptions,
  ] = await Promise.all([

    Interview.countDocuments({
      status: "unscheduled",
    }),

    UnscheduledInterview.countDocuments({
      status: "unscheduled",
    }),

    Interview.countDocuments({
      status: "cancelled",
    }),

    Disruption.countDocuments({
      status: "pending",
    }),
  ]);


  const unscheduled =
    unscheduledFromReplan +
    unscheduledFromGeneration;


  return {
    unscheduledInterviews:
      unscheduled,

    cancelledInterviews:
      cancelled,

    pendingDisruptions,

    totalIssues:
      unscheduled +
      cancelled +
      pendingDisruptions,
  };
};


// ============================================================
// COMPLETE DASHBOARD
// ============================================================

const getCompleteDashboard =
  async () => {

    const [
      summary,
      upcoming,
      disruptions,
      unscheduled,
      changes,
      conflicts,
    ] = await Promise.all([

      getDashboardSummary(),

      getUpcomingInterviews(20),

      getActiveDisruptions(),

      getUnscheduledInterviews(),

      getRecentChanges(),

      getConflictSummary(),
    ]);


    return {
      summary,

      upcomingInterviews:
        upcoming,

      disruptions,

      unscheduledInterviews:
        unscheduled,

      recentChanges:
        changes,

      conflicts,
    };
  };


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  getDashboardSummary,

  getUpcomingInterviews,

  getActiveDisruptions,

  getUnscheduledInterviews,

  getRecentChanges,

  getConflictSummary,

  getCompleteDashboard,
};