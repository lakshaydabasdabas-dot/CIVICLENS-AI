import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.message =
        "Backend is unreachable. Check VITE_API_BASE_URL or start the API server.";
    }

    return Promise.reject(error);
  }
);

export const getHealthStatus = () => API.get("/health/");
export const getAllComplaints = () => API.get("/complaints/");
export const getComplaintById = (complaintId) => API.get(`/complaints/${complaintId}`);

export const createComplaint = (payload) =>
  API.post("/complaints/", payload);

export const sendOTP = (payload) =>
  API.post("/auth/send-otp", payload);

export const verifyOTP = (payload) =>
  API.post("/auth/verify-otp", payload);

export const updateComplaintStatus = (complaintId, payload) =>
  API.patch(`/complaints/${complaintId}/status`, payload);

export const getDashboardStats = () => API.get("/dashboard/stats");

export const analyzeComplaint = (payload) =>
  API.post("/analyze/", payload);

export default API;
