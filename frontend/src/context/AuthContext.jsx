import { createContext, useEffect, useState } from "react";

import authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      if (!localStorage.getItem("access_token")) {
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
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const profile = await authService.me();
    setUser(profile);
    setIsAuthenticated(true);
  };

  const register = async (username, password) => {
    await authService.register(username, password);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
