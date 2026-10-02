import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3002",
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is expired/invalid, log the user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = ["/login", "/signup"].includes(err.config?.url);
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

export default api;
