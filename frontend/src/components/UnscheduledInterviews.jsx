const UnscheduledInterviews = ({
  interviews,
}) => {

  return (
    <section className="dashboard-section">

      <div className="section-header">

        <h2>
          Unscheduled Interviews
        </h2>

        <span className="alert-badge">
          {interviews?.length ?? 0}
        </span>

      </div>


      {interviews?.length === 0 ? (

        <div className="empty-state">
          All interviews are scheduled.
        </div>

      ) : (

        <div className="unscheduled-list">

          {interviews
            ?.slice(0, 10)
            .map((item) => (

              <div
                className="unscheduled-item"
                key={item._id}
              >

                <div>

                  <strong>
                    {
                      item.company?.name ||
                      "Unknown Company"
                    }
                  </strong>

                  <span>
                    {
                      item.student?.name ||
                      item.student?.studentId ||
                      "Unknown Student"
                    }
                  </span>

                </div>


                <p>
                  {
                    item.reason ||
                    item.cancellationReason ||
                    "No feasible slot"
                  }
                </p>

                {item.day ? (
                  <span className="unscheduled-day">
                    Was scheduled for Day {item.day}
                  </span>
                ) : null}

              </div>

            ))}

        </div>

      )}

    </section>
  );
};


export default UnscheduledInterviews;