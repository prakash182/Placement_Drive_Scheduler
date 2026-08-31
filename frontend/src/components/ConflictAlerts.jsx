const ConflictAlerts = ({
  conflicts = {},
  disruptions = [],
}) => {

  const totalIssues =
    conflicts.totalIssues ?? 0;


  return (
    <section className="dashboard-section">

      <div className="section-header">

        <h2>
          Conflicts & Alerts
        </h2>

        <span
          className={
            totalIssues > 0
              ? "alert-badge"
              : "success-badge"
          }
        >
          {totalIssues}
        </span>

      </div>


      {/* CONFLICT SUMMARY */}

      <div className="conflict-summary">

        <div className="conflict-item">

          <span>
            Unscheduled
          </span>

          <strong>
            {
              conflicts.unscheduledInterviews ?? 0
            }
          </strong>

        </div>


        <div className="conflict-item">

          <span>
            Cancelled
          </span>

          <strong>
            {
              conflicts.cancelledInterviews ?? 0
            }
          </strong>

        </div>


        <div className="conflict-item">

          <span>
            Pending Disruptions
          </span>

          <strong>
            {
              conflicts.pendingDisruptions ?? 0
            }
          </strong>

        </div>

      </div>


      {/* DISRUPTIONS */}

      <div className="disruption-list">

        <h3>
          Recent Disruptions
        </h3>


        {disruptions.length === 0 ? (

          <div className="empty-state">
            No disruptions recorded.
          </div>

        ) : (

          disruptions
            .slice(0, 5)
            .map((disruption) => (

              <div
                className="disruption-item"
                key={disruption._id}
              >

                <div>

                  <strong>
                    {disruption.type || "Unknown"}
                  </strong>

                  <p>
                    {
                      disruption.reason ||
                      "No reason provided"
                    }
                  </p>

                </div>


                <span
                  className={
                    disruption.status === "processed"
                      ? "status-processed"
                      : "status-pending"
                  }
                >
                  {disruption.status}
                </span>

              </div>

            ))

        )}

      </div>

    </section>
  );
};

export default ConflictAlerts;