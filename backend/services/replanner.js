// backend/services/replanner.js

const Company = require("../models/Company");
const Student = require("../models/Student");
const Room = require("../models/Room");
const Panel = require("../models/Panel");
const Interview = require("../models/Interview");

const {
  generateTimeSlots,
  findAvailableRoom,
  findAvailablePanel,
  canScheduleInterview,
  timeToMinutes,
  minutesToTime,
} = require("./scheduler");


// ============================================================
// HELPER: CHECK IF ID MATCHES
// ============================================================

const sameId = (id1, id2) => {
  if (!id1 || !id2) {
    return false;
  }

  return id1.toString() === id2.toString();
};


// ============================================================
// HELPER: CREATE CHANGE RECORD
// ============================================================

const createChangeRecord = (
  interview,
  oldValues,
  newValues,
  reason
) => {
  return {
    interviewId: interview._id,

    student: interview.student,

    company: interview.company,

    reason,

    old: oldValues,

    new: newValues,
  };
};


// ============================================================
// FIND NEW SLOT FOR AN INTERVIEW
// ============================================================

const findNewSlot = async ({
  interview,
  scheduledInterviews,
  rooms,
  panels,
  company,
  student,
  preferredDay = null,
  preferredStartTime = null,
  preferredEndTime = null,
  excludedRoomId = null,
  excludedPanelId = null,
  // Optional hard floor on start time for one specific day, e.g.
  // { day: 2, minutes: 660 } meaning "on day 2, nothing can start
  // before 11:00". Used for company-delay replanning so a slot
  // that starts before the company has actually arrived is never
  // re-selected just because it's the original (preferred) slot.
  minStartTimeForDay = null,
}) => {
  const days = company.availableDays || [1, 2, 3, 4];

  // ----------------------------------------------------------
  // First try the existing day.
  // This helps minimize schedule changes.
  // ----------------------------------------------------------

  const orderedDays = [];

  if (
    preferredDay &&
    days.includes(preferredDay)
  ) {
    orderedDays.push(preferredDay);
  }

  days.forEach((day) => {
    if (!orderedDays.includes(day)) {
      orderedDays.push(day);
    }
  });


  // ----------------------------------------------------------
  // Try the old time first.
  // This is important for minimal-change replanning.
  // ----------------------------------------------------------

  for (const day of orderedDays) {
    let slots = generateTimeSlots(
      "09:00",
      "17:00",
      company.interviewDuration
    );

    if (
      day === preferredDay &&
      preferredStartTime &&
      preferredEndTime
    ) {
      const preferredSlot = {
        startTime: preferredStartTime,
        endTime: preferredEndTime,
      };

      const otherSlots = slots.filter(
        (slot) =>
          slot.startTime !== preferredStartTime
      );

      slots = [
        preferredSlot,
        ...otherSlots,
      ];
    }


    // --------------------------------------------------------
    // ENFORCE EARLIEST ALLOWED START TIME (e.g. company delay)
    // --------------------------------------------------------
    // This must run AFTER the preferred-slot reordering above,
    // otherwise the original (now-invalid) slot would still be
    // tried first and re-selected since nothing else blocks it.

    if (
      minStartTimeForDay &&
      minStartTimeForDay.day === day
    ) {
      slots = slots.filter(
        (slot) =>
          timeToMinutes(slot.startTime) >=
          minStartTimeForDay.minutes
      );
    }


    // --------------------------------------------------------
    // TRY EVERY SLOT
    // --------------------------------------------------------

    for (const slot of slots) {

      // Find room.
      const availableRoom =
        findAvailableRoom(
          rooms,
          scheduledInterviews,
          day,
          slot.startTime,
          slot.endTime
        );

      if (!availableRoom) {
        continue;
      }


      // Don't reuse a room that was explicitly removed.
      if (
        excludedRoomId &&
        sameId(
          availableRoom._id,
          excludedRoomId
        )
      ) {
        continue;
      }


      // Find panel.
      const availablePanel =
        findAvailablePanel(
          panels,
          scheduledInterviews,
          company._id,
          day,
          slot.startTime,
          slot.endTime
        );

      if (!availablePanel) {
        continue;
      }


      // Don't use the panel that dropped out.
      if (
        excludedPanelId &&
        sameId(
          availablePanel._id,
          excludedPanelId
        )
      ) {
        continue;
      }


      // Validate all hard constraints.
      const validation =
        canScheduleInterview({
          student,
          company,
          room: availableRoom,
          panel: availablePanel,
          scheduledInterviews,
          day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });


      if (!validation.valid) {
        continue;
      }


      return {
        day,

        startTime:
          slot.startTime,

        endTime:
          slot.endTime,

        room:
          availableRoom,

        panel:
          availablePanel,
      };
    }
  }


  return null;
};


// ============================================================
// COMPANY DELAY
// ============================================================

const handleCompanyDelay = async (
  disruption
) => {
  const company =
    await Company.findById(
      disruption.company
    );

  if (!company) {
    throw new Error(
      "Company not found"
    );
  }


  const studentIds = [];


  // ----------------------------------------------------------
  // Find all students shortlisted by company.
  // ----------------------------------------------------------

  const students =
    await Student.find({
      shortlistedCompanies:
        company._id,
      status: "active",
    });


  students.forEach((student) => {
    studentIds.push(student._id);
  });


  // ----------------------------------------------------------
  // Find company interviews on affected day.
  // ----------------------------------------------------------

  // A delay is meaningless without a specific day to anchor it to.
  // If the caller didn't supply one, fall back to the company's
  // first available day rather than silently comparing interview
  // times across unrelated days.

  const effectiveDay =
    disruption.day ||
    (company.availableDays && company.availableDays[0]) ||
    null;

  const query = {
    company: company._id,
    status: "scheduled",
  };


  if (disruption.day) {
    query.day = disruption.day;
  }


  let affectedInterviews =
    await Interview.find(query);


  // ----------------------------------------------------------
  // If delay is 0, nothing to change.
  // ----------------------------------------------------------

  if (
    !disruption.delayMinutes ||
    disruption.delayMinutes <= 0
  ) {
    return {
      type: "COMPANY_DELAY",

      affected: 0,

      changed: 0,

      cancelled: 0,

      changes: [],
    };
  }


  const changes = [];

  let cancelled = 0;


  // ----------------------------------------------------------
  // Determine new company arrival time.
  // ----------------------------------------------------------

  const arrivalTime =
    timeToMinutes(
      company.arrivalTime || "09:00"
    );

  const delayedArrival =
    arrivalTime +
    disruption.delayMinutes;


  // ----------------------------------------------------------
  // Process each affected interview.
  // ----------------------------------------------------------

  for (const interview of affectedInterviews) {

    // The arrival delay only applies to the disrupted day.
    // Interviews on other days (relevant when disruption.day
    // wasn't supplied and the query above pulled every day)
    // are untouched.

    if (
      effectiveDay &&
      interview.day !== effectiveDay
    ) {
      continue;
    }


    const interviewStart =
      timeToMinutes(
        interview.startTime
      );


    // Interviews already starting after the delayed
    // arrival don't need to move.

    if (
      interviewStart >= delayedArrival
    ) {
      continue;
    }


    // --------------------------------------------------------
    // Get student.
    // --------------------------------------------------------

    const student =
      await Student.findById(
        interview.student
      );

    if (!student) {
      continue;
    }


    // --------------------------------------------------------
    // Get all OTHER interviews.
    // The current interview is excluded.
    // --------------------------------------------------------

    const otherInterviews =
      await Interview.find({
        _id: {
          $ne: interview._id,
        },
        status: "scheduled",
      });


    // --------------------------------------------------------
    // Get rooms and panels.
    // --------------------------------------------------------

    const rooms =
      await Room.find({
        available: true,
      });

    const panels =
      await Panel.find({
        status: "available",
      });


    // --------------------------------------------------------
    // Find a new slot.
    // --------------------------------------------------------

    const newSlot =
      await findNewSlot({
        interview,

        scheduledInterviews:
          otherInterviews,

        rooms,

        panels,

        company,

        student,

        preferredDay:
          interview.day,

        preferredStartTime:
          interview.startTime,

        preferredEndTime:
          interview.endTime,

        // This is the actual fix for the delay: without it,
        // findNewSlot would just re-select the original (now
        // too-early) slot since nothing else blocks it.
        minStartTimeForDay: {
          day: interview.day,
          minutes: delayedArrival,
        },
      });


    // --------------------------------------------------------
    // No replacement found.
    // --------------------------------------------------------

    if (!newSlot) {

      interview.status =
        "unscheduled";

      interview.cancellationReason =
        "Company delayed and no replacement slot available";

      await interview.save();

      cancelled++;

      changes.push(
        createChangeRecord(
          interview,

          {
            day: interview.day,
            startTime:
              interview.startTime,
            endTime:
              interview.endTime,
            room:
              interview.room,
            panel:
              interview.panel,
          },

          {
            status:
              "unscheduled",
          },

          "Company delay"
        )
      );

      continue;
    }


    // --------------------------------------------------------
    // Save old values.
    // --------------------------------------------------------

    const oldValues = {
      day: interview.day,

      startTime:
        interview.startTime,

      endTime:
        interview.endTime,

      room:
        interview.room,

      panel:
        interview.panel,
    };


    // --------------------------------------------------------
    // Update interview.
    // --------------------------------------------------------

    interview.day =
      newSlot.day;

    interview.startTime =
      newSlot.startTime;

    interview.endTime =
      newSlot.endTime;

    interview.room =
      newSlot.room._id;

    interview.panel =
      newSlot.panel._id;

    interview.version =
      (interview.version || 1) + 1;


    await interview.save();


    changes.push(
      createChangeRecord(
        interview,

        oldValues,

        {
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
        },

        "Company delay"
      )
    );
  }


  return {
    type: "COMPANY_DELAY",

    affected:
      affectedInterviews.length,

    changed:
      changes.length - cancelled,

    cancelled,

    changes,
  };
};


// ============================================================
// PANEL UNAVAILABLE
// ============================================================

const handlePanelUnavailable = async (
  disruption
) => {

  // ----------------------------------------------------------
  // Find panel.
  // ----------------------------------------------------------

  const panel =
    await Panel.findById(
      disruption.panel
    );

  if (!panel) {
    throw new Error(
      "Panel not found"
    );
  }


  // ----------------------------------------------------------
  // Mark panel unavailable.
  // ----------------------------------------------------------

  panel.status =
    "unavailable";

  panel.unavailableReason =
    disruption.reason ||
    "Panel unavailable";

  await panel.save();


  // ----------------------------------------------------------
  // Find affected interviews.
  // ----------------------------------------------------------

  const affectedInterviews =
    await Interview.find({
      panel: panel._id,
      status: "scheduled",
    });


  const changes = [];

  let cancelled = 0;


  // ----------------------------------------------------------
  // Process affected interviews.
  // ----------------------------------------------------------

  for (const interview of affectedInterviews) {

    const student =
      await Student.findById(
        interview.student
      );

    const company =
      await Company.findById(
        interview.company
      );


    if (!student || !company) {
      continue;
    }


    // Get all other interviews.
    const otherInterviews =
      await Interview.find({
        _id: {
          $ne: interview._id,
        },

        status: "scheduled",
      });


    const rooms =
      await Room.find({
        available: true,
      });


    const panels =
      await Panel.find({
        status: "available",
      });


    // --------------------------------------------------------
    // Try to keep same time first.
    // --------------------------------------------------------

    const newSlot =
      await findNewSlot({
        interview,

        scheduledInterviews:
          otherInterviews,

        rooms,

        panels,

        company,

        student,

        preferredDay:
          interview.day,

        preferredStartTime:
          interview.startTime,

        preferredEndTime:
          interview.endTime,

        excludedPanelId:
          panel._id,
      });


    // --------------------------------------------------------
    // No replacement.
    // --------------------------------------------------------

    if (!newSlot) {

      const oldValues = {
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
      };


      interview.status =
        "unscheduled";

      interview.cancellationReason =
        "Panel unavailable and no replacement found";

      interview.version =
        (interview.version || 1) + 1;

      await interview.save();

      cancelled++;


      changes.push(
        createChangeRecord(
          interview,

          oldValues,

          {
            status:
              "unscheduled",
          },

          "Panel unavailable"
        )
      );

      continue;
    }


    // --------------------------------------------------------
    // Save old values.
    // --------------------------------------------------------

    const oldValues = {
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
    };


    // --------------------------------------------------------
    // Update interview.
    // --------------------------------------------------------

    interview.day =
      newSlot.day;

    interview.startTime =
      newSlot.startTime;

    interview.endTime =
      newSlot.endTime;

    interview.room =
      newSlot.room._id;

    interview.panel =
      newSlot.panel._id;

    interview.version =
      (interview.version || 1) + 1;


    await interview.save();


    changes.push(
      createChangeRecord(
        interview,

        oldValues,

        {
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
        },

        "Panel unavailable"
      )
    );
  }


  return {
    type:
      "PANEL_UNAVAILABLE",

    affected:
      affectedInterviews.length,

    changed:
      changes.length - cancelled,

    cancelled,

    changes,
  };
};


// ============================================================
// STUDENT WITHDRAWAL
// ============================================================

const handleStudentWithdrawal =
  async (disruption) => {

    const student =
      await Student.findById(
        disruption.student
      );

    if (!student) {
      throw new Error(
        "Student not found"
      );
    }


    // --------------------------------------------------------
    // Mark student withdrawn.
    // --------------------------------------------------------

    student.status =
      "withdrawn";

    await student.save();


    // --------------------------------------------------------
    // Find student's interviews.
    // --------------------------------------------------------

    const affectedInterviews =
      await Interview.find({
        student: student._id,
        status: "scheduled",
      });


    const changes = [];


    // --------------------------------------------------------
    // Cancel all interviews.
    // --------------------------------------------------------

    for (
      const interview
      of affectedInterviews
    ) {

      const oldValues = {
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
      };


      interview.status =
        "cancelled";

      interview.cancellationReason =
        disruption.reason ||
        "Student withdrew";


      interview.version =
        (interview.version || 1) + 1;


      await interview.save();


      changes.push(
        createChangeRecord(
          interview,

          oldValues,

          {
            status:
              "cancelled",
          },

          "Student withdrawal"
        )
      );
    }


    return {
      type:
        "STUDENT_WITHDRAWAL",

      affected:
        affectedInterviews.length,

      changed: 0,

      cancelled:
        affectedInterviews.length,

      changes,
    };
  };


// ============================================================
// ROOM UNAVAILABLE
// ============================================================

const handleRoomUnavailable =
  async (disruption) => {

    const room =
      await Room.findById(
        disruption.room
      );

    if (!room) {
      throw new Error(
        "Room not found"
      );
    }


    // --------------------------------------------------------
    // Mark room unavailable.
    // --------------------------------------------------------

    room.available = false;

    room.unavailableReason =
      disruption.reason ||
      "Room unavailable";

    await room.save();


    // --------------------------------------------------------
    // Find affected interviews.
    // --------------------------------------------------------

    const affectedInterviews =
      await Interview.find({
        room: room._id,
        status: "scheduled",
      });


    const changes = [];

    let cancelled = 0;


    // --------------------------------------------------------
    // Process interviews.
    // --------------------------------------------------------

    for (
      const interview
      of affectedInterviews
    ) {

      const student =
        await Student.findById(
          interview.student
        );

      const company =
        await Company.findById(
          interview.company
        );


      if (!student || !company) {
        continue;
      }


      const otherInterviews =
        await Interview.find({
          _id: {
            $ne: interview._id,
          },

          status: "scheduled",
        });


      const rooms =
        await Room.find({
          available: true,
        });


      const panels =
        await Panel.find({
          status: "available",
        });


      // ------------------------------------------------------
      // Try to preserve original time.
      // ------------------------------------------------------

      const newSlot =
        await findNewSlot({
          interview,

          scheduledInterviews:
            otherInterviews,

          rooms,

          panels,

          company,

          student,

          preferredDay:
            interview.day,

          preferredStartTime:
            interview.startTime,

          preferredEndTime:
            interview.endTime,

          excludedRoomId:
            room._id,
        });


      // ------------------------------------------------------
      // No replacement.
      // ------------------------------------------------------

      if (!newSlot) {

        const oldValues = {
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
        };


        interview.status =
          "unscheduled";

        interview.cancellationReason =
          "Room unavailable and no replacement found";

        interview.version =
          (interview.version || 1) + 1;

        await interview.save();

        cancelled++;


        changes.push(
          createChangeRecord(
            interview,

            oldValues,

            {
              status:
                "unscheduled",
            },

            "Room unavailable"
          )
        );

        continue;
      }


      // ------------------------------------------------------
      // Save old values.
      // ------------------------------------------------------

      const oldValues = {
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
      };


      // ------------------------------------------------------
      // Update interview.
      // ------------------------------------------------------

      interview.day =
        newSlot.day;

      interview.startTime =
        newSlot.startTime;

      interview.endTime =
        newSlot.endTime;

      interview.room =
        newSlot.room._id;

      interview.panel =
        newSlot.panel._id;

      interview.version =
        (interview.version || 1) + 1;


      await interview.save();


      changes.push(
        createChangeRecord(
          interview,

          oldValues,

          {
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
          },

          "Room unavailable"
        )
      );
    }


    return {
      type:
        "ROOM_UNAVAILABLE",

      affected:
        affectedInterviews.length,

      changed:
        changes.length - cancelled,

      cancelled,

      changes,
    };
  };


// ============================================================
// MAIN REPLANNING FUNCTION
// ============================================================

const processDisruption = async (
  disruption
) => {

  switch (disruption.type) {

    case "COMPANY_DELAY":
      return await handleCompanyDelay(
        disruption
      );


    case "PANEL_UNAVAILABLE":
      return await handlePanelUnavailable(
        disruption
      );


    case "STUDENT_WITHDRAWAL":
      return await handleStudentWithdrawal(
        disruption
      );


    case "ROOM_UNAVAILABLE":
      return await handleRoomUnavailable(
        disruption
      );


    default:
      throw new Error(
        `Unsupported disruption type: ${disruption.type}`
      );
  }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  processDisruption,

  handleCompanyDelay,

  handlePanelUnavailable,

  handleStudentWithdrawal,

  handleRoomUnavailable,
};