const StatsCards = ({ summary }) => {

  if (!summary) {
    return null;
  }


  return (
    <div className="stats-grid">

      <div className="stat-card">

        <span className="stat-label">
          Scheduled
        </span>

        <strong className="stat-value">
          {summary.interviews?.scheduled ?? 0}
        </strong>

      </div>


      <div className="stat-card">

        <span className="stat-label">
          Unscheduled
        </span>

        <strong className="stat-value">
          {summary.interviews?.unscheduled ?? 0}
        </strong>

      </div>


      <div className="stat-card">

        <span className="stat-label">
          Success Rate
        </span>

        <strong className="stat-value">
          {summary.schedulingSuccessRate ?? 0}%
        </strong>

      </div>


      <div className="stat-card">

        <span className="stat-label">
          Companies
        </span>

        <strong className="stat-value">
          {summary.companies ?? 0}
        </strong>

      </div>


      <div className="stat-card">

        <span className="stat-label">
          Rooms
        </span>

        <strong className="stat-value">
          {summary.rooms ?? 0}
        </strong>

      </div>


      <div className="stat-card">

        <span className="stat-label">
          Panels
        </span>

        <strong className="stat-value">
          {summary.panels ?? 0}
        </strong>

      </div>


      <div className="stat-card">

        <span className="stat-label">
          Room Utilization
        </span>

        <strong className="stat-value">
          {summary.roomUtilization ?? 0}%
        </strong>

      </div>


      <div className="stat-card">

        <span className="stat-label">
          Panel Utilization
        </span>

        <strong className="stat-value">
          {summary.panelUtilization ?? 0}%
        </strong>

      </div>

    </div>
  );
};

export default StatsCards;