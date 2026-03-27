import axios from "axios";

// Use environment variable or fallback for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? "https://hackathon-967970713788.europe-west1.run.app/api" : "/api");

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for CORS credentials if needed
API.interceptors.request.use(
  (config) => {
    if (import.meta.env.PROD) {
      config.withCredentials = false; // Set to true if backend supports credentials
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      const baseUrl = API_BASE_URL.replace(/\/api$/, '');
      error.message = `Backend unreachable at ${baseUrl}. Check network or CORS configuration.`;
    }

    // Handle CORS errors specifically
    if (error.message.includes('CORS') || error.message.includes('Network Error')) {
      error.message = `CORS error: Frontend cannot reach backend at ${API_BASE_URL}. Check backend CORS configuration.`;
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
