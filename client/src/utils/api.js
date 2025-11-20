// src/utils/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* AUTH */
export const register = (data) => API.post("/api/users/register", data);
export const login = (data) => API.post("/api/users/login", data);
export const getProfile = () => API.get("/api/users/profile");

/* STUDY SESSIONS */
export const startSession = (data) =>
  API.post("/api/study-sessions/start", data);

export const endSession = (data) =>
  API.patch("/api/study-sessions/end", data);

export const getSessions = () =>
  API.get("/api/study-sessions");

export const saveSessionReport = (id, notes) =>
  API.patch(`/api/study-sessions/${id}/report`, { notes });

/* STREAK */
export const getStreak = () => API.get("/api/streak");

/* REPORTS */
export const generateReport = (type) =>
  API.post(`/api/reports/generate/${type}`);

export const getReports = () => API.get("/api/reports");

export const getReportById = (id) => API.get(`/api/reports/${id}`);

/* CHAT */
export const chatWithBot = (data) => API.post("/api/chat", data);

export default API;
