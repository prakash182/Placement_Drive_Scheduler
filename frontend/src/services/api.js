const API_BASE_URL = "https://placement-drive-scheduler.onrender.com/api";// ============================================================
// GENERIC API REQUEST
// ============================================================

const request = async (url, options = {}) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${url}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },

        ...options,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Something went wrong"
      );
    }

    return data;

  } catch (error) {
    console.error(
      `API Error (${url}):`,
      error
    );

    throw error;
  }
};


// ============================================================
// DASHBOARD
// ============================================================

export const getDashboard = async () => {
  return request("/dashboard");
};


// ============================================================
// SUMMARY
// ============================================================

export const getDashboardSummary = async () => {
  return request(
    "/dashboard/summary"
  );
};


// ============================================================
// UPCOMING INTERVIEWS
// ============================================================

export const getUpcomingInterviews = async (
  limit = 20
) => {
  return request(
    `/dashboard/upcoming?limit=${limit}`
  );
};


// ============================================================
// CONFLICTS
// ============================================================

export const getConflicts = async () => {
  return request(
    "/dashboard/conflicts"
  );
};


// ============================================================
// DISRUPTIONS
// ============================================================

export const getDisruptions = async () => {
  return request(
    "/dashboard/disruptions"
  );
};


// ============================================================
// UNSCHEDULED INTERVIEWS
// ============================================================

export const getUnscheduled = async () => {
  return request(
    "/dashboard/unscheduled"
  );
};


// ============================================================
// RECENT CHANGES
// ============================================================

export const getRecentChanges = async () => {
  return request(
    "/dashboard/changes"
  );
};


// ============================================================
// LOOKUPS (for disruption-trigger dropdowns)
// ============================================================

export const getCompanies = async () => {
  return request("/lookup/companies");
};

export const getPanels = async (companyId) => {
  const query = companyId ? `?company=${companyId}` : "";
  return request(`/lookup/panels${query}`);
};

export const getRooms = async () => {
  return request("/lookup/rooms");
};

export const getStudents = async (companyId) => {
  const query = companyId ? `?company=${companyId}` : "";
  return request(`/lookup/students${query}`);
};


// ============================================================
// CREATE DISRUPTION / REPLAN
// ============================================================

export const createDisruption = async (
  disruption
) => {
  return request(
    "/disruptions",
    {
      method: "POST",

      body: JSON.stringify(
        disruption
      ),
    }
  );
};