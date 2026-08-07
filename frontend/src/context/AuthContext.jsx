import { createContext, useEffect, useState } from "react";
import { authService } from "@recetaria/core";

import { webStorage } from "../services/webStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      if (!(await webStorage.getItem("access_token"))) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await authService.me();
        setUser(profile);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    loadCurrentUser();
  }, []);

  const login = async (username, password) => {
    const tokens = await authService.login(username, password);
    await webStorage.setItem("access_token", tokens.access_token);
    await webStorage.setItem("refresh_token", tokens.refresh_token);
    const profile = await authService.me();
    setUser(profile);
    setIsAuthenticated(true);
  };

  const register = async (username, password) => {
    await authService.register(username, password);
  };

  const logout = async () => {
    await webStorage.removeItem("access_token");
    await webStorage.removeItem("refresh_token");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
