import api from "./api";

const authService = {
  register: (username, password) => api.post("/api/v1/auth/register", { username, password }),
  login: (username, password) => api.post("/api/v1/auth/login", { username, password }),
  refresh: (refreshToken) => api.post("/api/v1/auth/refresh", { refresh_token: refreshToken }),
  me: () => api.get("/api/v1/auth/me"),
};

export default authService;
