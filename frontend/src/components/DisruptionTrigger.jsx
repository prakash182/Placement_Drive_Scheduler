import { useEffect, useState } from "react";

import {
  getCompanies,
  getPanels,
  getRooms,
  getStudents,
  createDisruption,
} from "../services/api";

// ============================================================
// DISRUPTION TRIGGER
// ============================================================
//
// This is the piece the assignment calls "one-click replan":
// the coordinator picks a disruption, fires it, and immediately
// sees the diff (what changed, who's affected) without leaving
// the dashboard.

const DISRUPTION_TYPES = [
  { value: "COMPANY_DELAY", label: "Company arriving late" },
  { value: "PANEL_UNAVAILABLE", label: "Panel dropped out" },
  { value: "STUDENT_WITHDRAWAL", label: "Student withdrew" },
  { value: "ROOM_UNAVAILABLE", label: "Room unavailable" },
];

const DisruptionTrigger = ({ onReplan }) => {
  const [type, setType] = useState("COMPANY_DELAY");

  const [companies, setCompanies] = useState([]);
  const [panels, setPanels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);

  const [companyId, setCompanyId] = useState("");
  const [panelId, setPanelId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [day, setDay] = useState(1);
  const [delayMinutes, setDelayMinutes] = useState(120);
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);

  // ----------------------------------------------------------
  // LOAD DROPDOWN DATA
  // ----------------------------------------------------------

  useEffect(() => {
    getCompanies()
      .then((res) => setCompanies(res.data || []))
      .catch(() => setCompanies([]));

    getRooms()
      .then((res) => setRooms(res.data || []))
      .catch(() => setRooms([]));
  }, []);

  useEffect(() => {
    if (type === "PANEL_UNAVAILABLE" && companyId) {
      getPanels(companyId)
        .then((res) => setPanels(res.data || []))
        .catch(() => setPanels([]));
    } else {
      setPanels([]);
      setPanelId("");
    }
  }, [type, companyId]);

  useEffect(() => {
    if (type === "STUDENT_WITHDRAWAL") {
      getStudents(companyId || undefined)
        .then((res) => setStudents(res.data || []))
        .catch(() => setStudents([]));
    } else {
      setStudents([]);
      setStudentId("");
    }
  }, [type, companyId]);

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

  const canSubmit = () => {
    if (type === "COMPANY_DELAY") {
      return Boolean(companyId) && Number(delayMinutes) > 0;
    }

    if (type === "PANEL_UNAVAILABLE") {
      return Boolean(panelId);
    }

    if (type === "STUDENT_WITHDRAWAL") {
      return Boolean(studentId);
    }

    if (type === "ROOM_UNAVAILABLE") {
      return Boolean(roomId);
    }

    return false;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit() || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");
    setLastResult(null);

    const payload = {
      type,
      reason: reason || undefined,
    };

    if (type === "COMPANY_DELAY") {
      payload.company = companyId;
      payload.day = Number(day);
      payload.delayMinutes = Number(delayMinutes);
    }

    if (type === "PANEL_UNAVAILABLE") {
      payload.panel = panelId;
    }

    if (type === "STUDENT_WITHDRAWAL") {
      payload.student = studentId;
    }

    if (type === "ROOM_UNAVAILABLE") {
      payload.room = roomId;
    }

    try {
      const response = await createDisruption(payload);

      setLastResult(response.result);

      if (onReplan) {
        onReplan();
      }
    } catch (err) {
      setError(err.message || "Failed to process disruption");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <h2>Trigger Disruption</h2>
      </div>

      <form className="disruption-form" onSubmit={handleSubmit}>
        <label>
          Disruption type
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {DISRUPTION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {type === "COMPANY_DELAY" && (
          <>
            <label>
              Company
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Day
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                {[1, 2, 3, 4].map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Delay (minutes)
              <input
                type="number"
                min="15"
                step="15"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
              />
            </label>
          </>
        )}

        {type === "PANEL_UNAVAILABLE" && (
          <>
            <label>
              Company
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Panel
              <select
                value={panelId}
                onChange={(e) => setPanelId(e.target.value)}
                disabled={!companyId}
              >
                <option value="">
                  {companyId ? "Select a panel" : "Pick a company first"}
                </option>
                {panels.map((panel) => (
                  <option key={panel._id} value={panel._id}>
                    {panel.panelId}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {type === "STUDENT_WITHDRAWAL" && (
          <>
            <label>
              Company (optional filter)
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">All companies</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Student
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.studentId} — {student.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {type === "ROOM_UNAVAILABLE" && (
          <label>
            Room
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomNumber}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Reason (optional)
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Traffic on the highway"
          />
        </label>

        <button
          type="submit"
          className="refresh-button"
          disabled={!canSubmit() || submitting}
        >
          {submitting ? "Replanning..." : "Trigger & Replan"}
        </button>
      </form>

      {error && <div className="disruption-error">{error}</div>}

      {lastResult && (
        <div className="disruption-result">
          <h3>Replan result</h3>

          <div className="disruption-result-stats">
            <span>Affected: {lastResult.affected}</span>
            <span>Changed: {lastResult.changed}</span>
            <span>Cancelled: {lastResult.cancelled}</span>
          </div>

          {lastResult.changes && lastResult.changes.length > 0 && (
            <ul className="disruption-diff-list">
              {lastResult.changes.slice(0, 15).map((change, index) => (
                <li key={change.interviewId || index}>
                  <strong>{change.reason}</strong>
                  {change.old && change.new ? (
                    <span>
                      {" "}
                      — {change.old.day != null ? `Day ${change.old.day} ` : ""}
                      {change.old.startTime || ""}
                      {change.old.startTime ? " → " : ""}
                      {change.new.status === "cancelled" ||
                      change.new.status === "unscheduled"
                        ? change.new.status
                        : `Day ${change.new.day} ${change.new.startTime}`}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default DisruptionTrigger;
