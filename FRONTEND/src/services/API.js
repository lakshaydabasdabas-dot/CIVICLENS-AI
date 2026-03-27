const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
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
    const error = new Error(
      payload?.detail || payload?.message || "API request failed."
    );
    error.response = {
      status: response.status,
      data: payload,
    };
    throw error;
  }

  return {
    status: response.status,
    data: payload,
  };
}

function normalizeComplaint(complaint) {
  return {
    ...complaint,
    lat:
      complaint?.lat !== null && complaint?.lat !== undefined
        ? Number(complaint.lat)
        : null,
    lng:
      complaint?.lng !== null && complaint?.lng !== undefined
        ? Number(complaint.lng)
        : null,
    similarity_score:
      complaint?.similarity_score !== null &&
      complaint?.similarity_score !== undefined
        ? Number(complaint.similarity_score)
        : null,
    priority_score:
      complaint?.priority_score !== null &&
      complaint?.priority_score !== undefined
        ? Number(complaint.priority_score)
        : null,
    model_confidence:
      complaint?.model_confidence !== null &&
      complaint?.model_confidence !== undefined
        ? Number(complaint.model_confidence)
        : null,
  };
}

export async function createComplaint(payload) {
  const response = await request("/api/complaints", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    ...response,
    data: normalizeComplaint(response.data),
  };
}

export async function getComplaints() {
  const response = await request("/api/complaints");
  return {
    ...response,
    data: Array.isArray(response.data)
      ? response.data.map(normalizeComplaint)
      : [],
  };
}

export async function getComplaintById(complaintId) {
  const response = await request(`/api/complaints/${complaintId}`);
  return {
    ...response,
    data: normalizeComplaint(response.data),
  };
}

export async function updateComplaintStatus(complaintId, status) {
  const response = await request(`/api/complaints/${complaintId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return {
    ...response,
    data: normalizeComplaint(response.data),
  };
}

export async function analyzeComplaint(payload) {
  return request("/api/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDashboardStats() {
  return request("/api/dashboard/stats");
}

export { API_BASE_URL };