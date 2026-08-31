const Company = require("../models/Company");
const Student = require("../models/Student");
const Room = require("../models/Room");
const Panel = require("../models/Panel");
const Interview = require("../models/Interview");

// backend/services/scheduler.js

// ============================================================
// SCHEDULER CONFIGURATION
// ============================================================

// Placement working hours.
// This is our implementation assumption because the assignment
// specifies 4 days but does not specify daily working hours.

const DAY_START = "09:00";
const DAY_END = "17:00";

// Candidate slots will be checked every 15 minutes.
// Interview duration can still be 30, 45, etc.
const SLOT_INTERVAL = 15;


// ============================================================
// 1. TIME CONVERSION FUNCTIONS
// ============================================================

// Convert "HH:MM" into total minutes.
//
// Example:
// "09:00" -> 540
// "10:30" -> 630

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};


// Convert total minutes back into "HH:MM".
//
// Example:
// 540 -> "09:00"
// 630 -> "10:30"

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);

  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
};


// ============================================================
// 2. GENERATE TIME SLOTS
// ============================================================

// Generates all possible interview slots between startTime
// and endTime.
//
// Example for 30-minute interview:
//
// 09:00 - 09:30
// 09:15 - 09:45
// 09:30 - 10:00
// ...

const generateTimeSlots = (
  startTime = DAY_START,
  endTime = DAY_END,
  duration
) => {
  const slots = [];

  const startMinutes = timeToMinutes(startTime);

  const endMinutes = timeToMinutes(endTime);

  for (
    let current = startMinutes;
    current + duration <= endMinutes;
    current += SLOT_INTERVAL
  ) {
    slots.push({
      startTime: minutesToTime(current),

      endTime: minutesToTime(
        current + duration
      ),
    });
  }

  return slots;
};


// ============================================================
// 3. CHECK TIME OVERLAP
// ============================================================

// Determines whether two interviews overlap.
//
// Example:
//
// A: 10:00 - 10:45
// B: 10:30 - 11:00
//
// Result: true
//
// Example:
//
// A: 10:00 - 10:45
// B: 10:45 - 11:30
//
// Result: false

const isTimeOverlap = (
  startA,
  endA,
  startB,
  endB
) => {
  const startAMinutes = timeToMinutes(startA);

  const endAMinutes = timeToMinutes(endA);

  const startBMinutes = timeToMinutes(startB);

  const endBMinutes = timeToMinutes(endB);

  return (
    startAMinutes < endBMinutes &&
    endAMinutes > startBMinutes
  );
};


// ============================================================
// 4. STUDENT CONFLICT CHECK
// ============================================================

// Checks whether the student already has another interview
// at the requested day/time.
//
// This prevents:
//
// Student S001
// 10:00 - 10:45 Google
// 10:30 - 11:00 Amazon
//
// because the student cannot attend both.

const hasStudentConflict = (
  scheduledInterviews,
  studentId,
  day,
  startTime,
  endTime
) => {
  return scheduledInterviews.some((interview) => {
    return (
      interview.student.toString() ===
        studentId.toString() &&
      interview.day === day &&
      isTimeOverlap(
        interview.startTime,
        interview.endTime,
        startTime,
        endTime
      )
    );
  });
};


// ============================================================
// 5. ROOM CONFLICT CHECK
// ============================================================

// Checks whether a room is already occupied.
//
// Example:
//
// R01
// 10:00 - 10:45 Google
//
// Requested:
//
// R01
// 10:30 - 11:00 Amazon
//
// Result: conflict.

const hasRoomConflict = (
  scheduledInterviews,
  roomId,
  day,
  startTime,
  endTime
) => {
  return scheduledInterviews.some((interview) => {
    return (
      interview.room.toString() ===
        roomId.toString() &&
      interview.day === day &&
      isTimeOverlap(
        interview.startTime,
        interview.endTime,
        startTime,
        endTime
      )
    );
  });
};


// ============================================================
// 6. PANEL CONFLICT CHECK
// ============================================================

// Checks whether a panel is already conducting another
// interview during the requested time.
//
// A panel cannot conduct two interviews simultaneously.

const hasPanelConflict = (
  scheduledInterviews,
  panelId,
  day,
  startTime,
  endTime
) => {
  return scheduledInterviews.some((interview) => {
    return (
      interview.panel.toString() ===
        panelId.toString() &&
      interview.day === day &&
      isTimeOverlap(
        interview.startTime,
        interview.endTime,
        startTime,
        endTime
      )
    );
  });
};


// ============================================================
// 7. CGPA ELIGIBILITY CHECK
// ============================================================

// Checks whether the student's CGPA satisfies the company's
// minimum CGPA requirement.
//
// Example:
//
// Company cutoff = 8.0
// Student CGPA = 8.4
//
// Result: true
//
// Company cutoff = 8.0
// Student CGPA = 7.5
//
// Result: false

const isStudentEligible = (
  student,
  company
) => {
  return (
    student.cgpa >= company.cgpaCutoff
  );
};


// ============================================================
// 8. FIND AVAILABLE ROOM
// ============================================================

// Searches for a room that:
//
// 1. Is available.
// 2. Is not already booked.
// 3. Is free during the requested time.

const findAvailableRoom = (
  rooms,
  scheduledInterviews,
  day,
  startTime,
  endTime
) => {
  for (const room of rooms) {

    // Skip unavailable rooms.
    if (!room.available) {
      continue;
    }

    const conflict = hasRoomConflict(
      scheduledInterviews,
      room._id,
      day,
      startTime,
      endTime
    );

    // If no conflict, this room can be used.
    if (!conflict) {
      return room;
    }
  }

  // No room available.
  return null;
};


// ============================================================
// 9. FIND AVAILABLE PANEL
// ============================================================

// Finds an available panel belonging to the company.
//
// A Google interview must use a Google panel.
// It cannot use an Amazon panel.

const findAvailablePanel = (
  panels,
  scheduledInterviews,
  companyId,
  day,
  startTime,
  endTime
) => {

  // First find panels belonging to this company.
  const companyPanels = panels.filter(
    (panel) =>
      panel.company.toString() ===
        companyId.toString() &&
      panel.status === "available"
  );

  // Check each company panel.
  for (const panel of companyPanels) {

    const conflict = hasPanelConflict(
      scheduledInterviews,
      panel._id,
      day,
      startTime,
      endTime
    );

    // Panel is free.
    if (!conflict) {
      return panel;
    }
  }

  // No panel available.
  return null;
};


// ============================================================
// 10. COMPLETE INTERVIEW VALIDATION
// ============================================================

// This function combines all hard constraints.
//
// Before creating an interview, we ask:
//
// - Is the student eligible?
// - Is a room available?
// - Is a panel available?
// - Does the student have a conflict?
// - Does the room have a conflict?
// - Does the panel have a conflict?
//
// If any hard constraint fails, the interview cannot be
// scheduled in that slot.

const canScheduleInterview = ({
  student,
  company,
  room,
  panel,
  scheduledInterviews,
  day,
  startTime,
  endTime,
}) => {

  // ----------------------------------------------------------
  // CGPA CHECK
  // ----------------------------------------------------------

  if (!isStudentEligible(student, company)) {
    return {
      valid: false,
      reason:
        "Student does not meet CGPA cutoff",
    };
  }


  // ----------------------------------------------------------
  // ROOM CHECK
  // ----------------------------------------------------------

  if (!room) {
    return {
      valid: false,
      reason: "No room available",
    };
  }


  // ----------------------------------------------------------
  // PANEL CHECK
  // ----------------------------------------------------------

  if (!panel) {
    return {
      valid: false,
      reason: "No panel available",
    };
  }


  // ----------------------------------------------------------
  // STUDENT CONFLICT CHECK
  // ----------------------------------------------------------

  if (
    hasStudentConflict(
      scheduledInterviews,
      student._id,
      day,
      startTime,
      endTime
    )
  ) {
    return {
      valid: false,
      reason:
        "Student has another interview at this time",
    };
  }


  // ----------------------------------------------------------
  // ROOM CONFLICT CHECK
  // ----------------------------------------------------------

  if (
    hasRoomConflict(
      scheduledInterviews,
      room._id,
      day,
      startTime,
      endTime
    )
  ) {
    return {
      valid: false,
      reason:
        "Room is already booked",
    };
  }


  // ----------------------------------------------------------
  // PANEL CONFLICT CHECK
  // ----------------------------------------------------------

  if (
    hasPanelConflict(
      scheduledInterviews,
      panel._id,
      day,
      startTime,
      endTime
    )
  ) {
    return {
      valid: false,
      reason:
        "Panel is already booked",
    };
  }


  // ----------------------------------------------------------
  // ALL HARD CONSTRAINTS PASSED
  // ----------------------------------------------------------

  return {
    valid: true,
    reason: null,
  };
};


// ============================================================
// 11. EXPORT FUNCTIONS
// ============================================================

module.exports = {
  DAY_START,
  DAY_END,
  SLOT_INTERVAL,

  timeToMinutes,
  minutesToTime,

  generateTimeSlots,

  isTimeOverlap,

  hasStudentConflict,
  hasRoomConflict,
  hasPanelConflict,

  isStudentEligible,

  findAvailableRoom,
  findAvailablePanel,

  canScheduleInterview,
};