const Company = require("../models/Company");
const Student = require("../models/Student");
const Room = require("../models/Room");
const Panel = require("../models/Panel");
const Interview = require("../models/Interview");
const UnscheduledInterview = require("../models/UnscheduledInterview");

const {
  generateTimeSlots,
  findAvailableRoom,
  findAvailablePanel,
  canScheduleInterview,
} = require("./scheduler");

// ============================================================
// GENERATE PLACEMENT SCHEDULE
// ============================================================

const generateSchedule = async () => {
  try {
    console.log("-----------------------------------");
    console.log("Starting schedule generation...");
    console.log("-----------------------------------");

    // --------------------------------------------------------
    // 1. CLEAR OLD SCHEDULE
    // --------------------------------------------------------

    await Interview.deleteMany({});
    await UnscheduledInterview.deleteMany({});

    console.log("Old interviews cleared.");

    // --------------------------------------------------------
    // 2. FETCH DATA
    // --------------------------------------------------------

    const companies = await Company.find({});

    const students = await Student.find({});

    const rooms = await Room.find({
      available: true,
    });

    const panels = await Panel.find({
      status: "available",
    });

    console.log(`Companies loaded: ${companies.length}`);
    console.log(`Students loaded: ${students.length}`);
    console.log(`Rooms loaded: ${rooms.length}`);
    console.log(`Panels loaded: ${panels.length}`);

    // --------------------------------------------------------
    // 3. SORT COMPANIES BY PRIORITY
    // --------------------------------------------------------

    // Tier 1 companies are scheduled first.
    //
    // 1 = highest priority
    // 2 = medium priority
    // 3 = lower priority

    companies.sort(
      (companyA, companyB) => companyA.priorityTier - companyB.priorityTier,
    );

    // --------------------------------------------------------
    // 4. STORE SCHEDULE IN MEMORY
    // --------------------------------------------------------

    // We keep already scheduled interviews in memory
    // so conflict checks are fast.

    const scheduledInterviews = [];

    // Interviews that could not be scheduled.

    const unscheduledInterviews = [];

    // --------------------------------------------------------
    // 5. PROCESS EACH COMPANY
    // --------------------------------------------------------

    for (const company of companies) {
      console.log(`Scheduling company: ${company.name}`);

      // ------------------------------------------------------
      // FIND STUDENTS SHORTLISTED BY THIS COMPANY
      // ------------------------------------------------------

      const companyStudents = students.filter(
        (student) =>
          student.shortlistedCompanies.some(
            (companyId) => companyId.toString() === company._id.toString(),
          ) &&
          student.status === "active" &&
          student.cgpa >= company.cgpaCutoff,
      );

      console.log(
        `${company.name}: ${companyStudents.length} eligible students`,
      );

      // ------------------------------------------------------
      // GET AVAILABLE PANELS FOR COMPANY
      // ------------------------------------------------------

      const companyPanels = panels.filter(
        (panel) =>
          panel.company.toString() === company._id.toString() &&
          panel.status === "available",
      );

      // If company has no panel at all,
      // none of its interviews can be scheduled.

      if (companyPanels.length === 0) {
        companyStudents.forEach((student) => {
          unscheduledInterviews.push({
            student: student._id,
            company: company._id,
            reason: "No panel available for company",
          });
        });

        continue;
      }

      // ------------------------------------------------------
      // 6. PROCESS EACH STUDENT
      // ------------------------------------------------------

      for (const student of companyStudents) {
        let interviewScheduled = false;

        // ----------------------------------------------------
        // COMPANY AVAILABLE DAYS
        // ----------------------------------------------------

        for (const day of company.availableDays) {
          if (interviewScheduled) {
            break;
          }

          // ----------------------------------------------
          // GENERATE TIME SLOTS
          // ----------------------------------------------

          const slots = generateTimeSlots(
            "09:00",
            "17:00",
            company.interviewDuration,
          );

          // ----------------------------------------------
          // TRY EACH TIME SLOT
          // ----------------------------------------------

          for (const slot of slots) {
            if (interviewScheduled) {
              break;
            }

            // --------------------------------------------
            // FIND AVAILABLE ROOM
            // --------------------------------------------

            const room = findAvailableRoom(
              rooms,
              scheduledInterviews,
              day,
              slot.startTime,
              slot.endTime,
            );

            // --------------------------------------------
            // FIND AVAILABLE PANEL
            // --------------------------------------------

            const panel = findAvailablePanel(
              panels,
              scheduledInterviews,
              company._id,
              day,
              slot.startTime,
              slot.endTime,
            );

            // --------------------------------------------
            // VALIDATE INTERVIEW
            // --------------------------------------------

            const validation = canScheduleInterview({
              student,
              company,
              room,
              panel,
              scheduledInterviews,
              day,
              startTime: slot.startTime,
              endTime: slot.endTime,
            });

            // --------------------------------------------
            // IF VALID → SCHEDULE
            // --------------------------------------------

            if (validation.valid) {
              const interview = {
                student: student._id,

                company: company._id,

                room: room._id,

                panel: panel._id,

                day,

                startTime: slot.startTime,

                endTime: slot.endTime,

                status: "scheduled",

                version: 1,
              };

              // Store in memory first.
              scheduledInterviews.push(interview);

              interviewScheduled = true;

              break;
            }
          }
        }

        // ----------------------------------------------------
        // IF STUDENT COULD NOT BE SCHEDULED
        // ----------------------------------------------------

        if (!interviewScheduled) {
          unscheduledInterviews.push({
            student: student._id,

            company: company._id,

            reason: "No feasible time slot available",
          });
        }
      }
    }

    // --------------------------------------------------------
    // 7. SAVE SCHEDULED INTERVIEWS TO DATABASE
    // --------------------------------------------------------

    let savedInterviews = [];

    if (scheduledInterviews.length > 0) {
      savedInterviews = await Interview.insertMany(scheduledInterviews);

      console.log("Inserted interviews:", savedInterviews.length);

      const actualInterviewCount = await Interview.countDocuments();

      console.log("Actual interviews in MongoDB:", actualInterviewCount);
    }

    // --------------------------------------------------------
    // SAVE UNSCHEDULED INTERVIEWS
    // --------------------------------------------------------

    let savedUnscheduled = [];

    if (unscheduledInterviews.length > 0) {
      savedUnscheduled = await UnscheduledInterview.insertMany(
        unscheduledInterviews,
      );
    }

    // --------------------------------------------------------
    // 8. GENERATE SUMMARY
    // --------------------------------------------------------

    const totalInterviews =
      scheduledInterviews.length + unscheduledInterviews.length;

    const scheduledCount = scheduledInterviews.length;

    const unscheduledCount = unscheduledInterviews.length;

    const scheduledPercentage =
      totalInterviews > 0
        ? ((scheduledCount / totalInterviews) * 100).toFixed(2)
        : 0;

    // --------------------------------------------------------
    // 9. LOG RESULTS
    // --------------------------------------------------------

    console.log("-----------------------------------");
    console.log("SCHEDULE GENERATION COMPLETED");
    console.log("-----------------------------------");

    console.log(`Total interviews: ${totalInterviews}`);

    console.log(`Scheduled: ${scheduledCount}`);

    console.log(`Unscheduled: ${unscheduledCount}`);

    console.log(`Success rate: ${scheduledPercentage}%`);

    console.log("-----------------------------------");

    // --------------------------------------------------------
    // 10. RETURN RESULT
    // --------------------------------------------------------

    return {
      success: true,

      summary: {
        totalInterviews,
        scheduled: scheduledCount,
        unscheduled: unscheduledCount,
        scheduledPercentage: Number(scheduledPercentage),
      },

      scheduledInterviews: savedInterviews,

      unscheduledInterviews: savedUnscheduled,
    };
  } catch (error) {
    console.error("Schedule generation failed:", error.message);

    throw error;
  }
};

module.exports = generateSchedule;
