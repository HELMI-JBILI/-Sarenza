import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 10000,
});

// Attaches the admin session token (used only by the future /admin area,
// never by the guest-checkout storefront).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sarenza_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
