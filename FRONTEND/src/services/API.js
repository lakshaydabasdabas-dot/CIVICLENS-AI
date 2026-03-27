export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(
    /\/$/,
    ""
  );

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || "Request failed");
  }

  return payload;
}

export function createComplaint(payload) {
  return request("/api/complaints/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getComplaints() {
  return request("/api/complaints/");
}

export function getComplaintById(id) {
  return request(`/api/complaints/${id}`);
}

export function updateComplaintStatus(id, status) {
  return request(`/api/complaints/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getDashboardStats() {
  return request("/api/dashboard/stats");
}

export function analyzeComplaint(payload) {
  return request("/api/analyze/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}