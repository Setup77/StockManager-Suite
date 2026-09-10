import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/symfony-stock/stock-api/public/index.php/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;