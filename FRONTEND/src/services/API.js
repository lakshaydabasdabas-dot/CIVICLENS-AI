import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://civiclens-ai-35yu.onrender.com/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getHealthStatus = () => API.get("/health/");
export const getAllComplaints = () => API.get("/complaints/");
export const getComplaintById = (complaintId) => API.get(`/complaints/${complaintId}`);

export const createComplaint = (payload) =>
  API.post("/complaints/", payload);

export const updateComplaintStatus = (complaintId, payload) =>
  API.patch(`/complaints/${complaintId}/status`, payload);

export const getDashboardStats = () => API.get("/dashboard/stats");

export const analyzeComplaint = (payload) =>
  API.post("/analyze/", payload);

export default API;
