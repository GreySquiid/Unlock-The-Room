import axios from "axios";

const isProduction = window.location.hostname !== "localhost";
const baseURL = isProduction
  ? "https://unlock-the-room-production.up.railway.app/api"
  : "http://localhost:5050/api";

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/game";
    }
    return Promise.reject(error);
  }
);

export default api;
