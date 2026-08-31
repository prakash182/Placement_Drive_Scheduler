const RecentChanges = ({
  changes,
}) => {

  return (
    <section className="dashboard-section">

      <div className="section-header">

        <h2>
          Recent Replanning Changes
        </h2>

        <span className="section-count">
          {changes?.length ?? 0}
        </span>

      </div>


      {changes?.length === 0 ? (

        <div className="empty-state">
          No replanning changes yet.
        </div>

      ) : (

        <div className="changes-list">

          {changes
            ?.slice(0, 10)
            .map((change) => (

              <div
                className="change-item"
                key={change.interviewId}
              >

                <div className="change-main">

                  <strong>
                    {
                      change.student?.name ||
                      change.student?.studentId ||
                      "Student"
                    }
                  </strong>

                  <span>
                    {
                      change.company?.name ||
                      "Company"
                    }
                  </span>

                </div>


                <div className="change-details">

                  <span>
                    Day {change.day}
                  </span>

                  <span>
                    {change.startTime}
                    {" - "}
                    {change.endTime}
                  </span>

                  <span>
                    Room:{" "}
                    {change.room?.roomNumber || "N/A"}
                  </span>

                  <span>
                    Panel:{" "}
                    {change.panel?.panelId || "N/A"}
                  </span>

                </div>


                <span className="version-badge">
                  v{change.version}
                </span>

              </div>

            ))}

        </div>

      )}

    </section>
  );
};


export default RecentChanges;