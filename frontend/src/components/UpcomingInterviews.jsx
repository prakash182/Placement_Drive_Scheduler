const UpcomingInterviews = ({
  interviews = [],
}) => {

  return (
    <section className="dashboard-section">

      <div className="section-header">

        <h2>
          Upcoming Interviews
        </h2>

        <span className="section-count">
          {interviews.length}
        </span>

      </div>


      {interviews.length === 0 ? (

        <div className="empty-state">
          No scheduled interviews.
        </div>

      ) : (

        <div className="interview-list">

          {interviews.map(
            (interview) => (

              <div
                className="interview-item"
                key={interview._id}
              >

                <div className="interview-time">

                  <strong>
                    {interview.startTime || "N/A"}
                  </strong>

                  <span>
                    Day {interview.day || "N/A"}
                  </span>

                </div>


                <div className="interview-info">

                  <strong>
                    {
                      interview.company?.name ||
                      "Unknown Company"
                    }
                  </strong>

                  <span>
                    {
                      interview.student?.name ||
                      interview.student?.studentId ||
                      "Unknown Student"
                    }
                  </span>

                </div>


                <div className="interview-location">

                  <span>
                    Room:{" "}
                    {
                      interview.room?.roomNumber ||
                      "N/A"
                    }
                  </span>

                  <span>
                    Panel:{" "}
                    {
                      interview.panel?.panelId ||
                      "N/A"
                    }
                  </span>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </section>
  );
};

export default UpcomingInterviews;