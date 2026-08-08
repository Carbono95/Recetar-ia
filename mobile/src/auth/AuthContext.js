import { createContext, useContext, useState } from "react";
import { authService } from "@recetaria/core";

import { secureStorage } from "../secureStorage";

// Contexto de autenticación del móvil. Espejo del AuthContext de la web: misma
// lógica (login guarda tokens y pide el perfil; logout los borra), cambiando
// solo el storage (Keychain vía secureStorage en vez de localStorage).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function login(username, password) {
    const tokens = await authService.login(username, password);
    await secureStorage.setItem("access_token", tokens.access_token);
    await secureStorage.setItem("refresh_token", tokens.refresh_token);
    // Llamada autenticada: prueba que el token guardado viaja en la cabecera.
    const profile = await authService.me();
    setUser(profile);
  }

  async function logout() {
    await secureStorage.removeItem("access_token");
    await secureStorage.removeItem("refresh_token");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
