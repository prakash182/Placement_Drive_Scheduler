import { useEffect, useState, useCallback } from "react";

import StatsCards from "./components/StatsCards";
import UpcomingInterviews from "./components/UpcomingInterviews";
import ConflictAlerts from "./components/ConflictAlerts";
import UnscheduledInterviews from "./components/UnscheduledInterviews";
import RecentChanges from "./components/RecentChanges";
import DisruptionTrigger from "./components/DisruptionTrigger";

import { getDashboard } from "./services/api";

import "./App.css";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDashboard();

      console.log("Dashboard API Response:", response);

      // API returns:
      // {
      //   success: true,
      //   data: {
      //     summary,
      //     upcomingInterviews,
      //     disruptions,
      //     unscheduledInterviews,
      //     recentChanges,
      //     conflicts
      //   }
      // }

      setDashboard(response.data);
    } catch (error) {
      console.error("Dashboard Error:", error);

      setError(
        error.message || "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          Loading placement dashboard...
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="app">
        <div className="error-screen">
          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button onClick={loadDashboard}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div className="app">

      {/* HEADER */}

      <header className="dashboard-header">
        <div>
          <h1>Placement Drive Scheduler</h1>

          <p>Coordinator Dashboard</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
        >
          ↻ Refresh
        </button>
      </header>


      {/* MAIN */}

      <main className="dashboard-container">

        {/* STATS */}

        <StatsCards
          summary={dashboard?.summary}
        />


        {/* UPCOMING + CONFLICTS */}

        <div className="dashboard-grid">

          <UpcomingInterviews
            interviews={
              dashboard?.upcomingInterviews || []
            }
          />

          <ConflictAlerts
            conflicts={
              dashboard?.conflicts || {}
            }
            disruptions={
              dashboard?.disruptions || []
            }
          />

        </div>


        {/* TRIGGER DISRUPTION / ONE-CLICK REPLAN */}

        <DisruptionTrigger onReplan={loadDashboard} />


        {/* UNSCHEDULED */}

        <UnscheduledInterviews
          interviews={
            dashboard?.unscheduledInterviews || []
          }
        />


        {/* RECENT CHANGES */}

        <RecentChanges
          changes={
            dashboard?.recentChanges || []
          }
        />

      </main>
    </div>
  );
}

export default App;