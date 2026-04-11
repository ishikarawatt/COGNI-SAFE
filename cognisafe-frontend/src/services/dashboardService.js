const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`,
});

export const getProfile = async (token) => {
  const res = await fetch(`${API}/api/users/me`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch profile");
  return data;
};

export const getSessionHistory = async (token, months = 1) => {
  const res = await fetch(`${API}/api/sessions/history?months=${months}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch history");
  return data; // [{ date, status, risk_tier, session_id }]
};

export const getLatestSession = async (token) => {
  const res = await fetch(`${API}/api/sessions/latest`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch latest session");
  return data;
};

export const getWeeklyReport = async (token) => {
  const res = await fetch(`${API}/api/reports/weekly`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch weekly report");
  return data;
};

export const getTrajectory = async (token, months = 6) => {
  const res = await fetch(`${API}/api/reports/trajectory?months=${months}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch trajectory");
  return data; // [{ month, score, session_count }]
};