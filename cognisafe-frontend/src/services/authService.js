const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const loginUser = async (email, password) => {
  const emailNorm = email.trim().toLowerCase();
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailNorm, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  return data; // { access_token, user_id, name, email }
};

export const registerUser = async (name, email, password, dob) => {
  const emailNorm = email.trim().toLowerCase();
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email: emailNorm, password, dob }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  return data;
};