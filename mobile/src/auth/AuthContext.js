import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@recetaria/core";

import { secureStorage } from "../secureStorage";

// Contexto de autenticación del móvil. Espejo del AuthContext de la web: misma
// lógica (login guarda tokens y pide el perfil; logout los borra), cambiando
// solo el storage (Keychain vía secureStorage en vez de localStorage).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // isLoading cubre el arranque: mientras comprobamos si hay sesión guardada no
  // sabemos aún si mostrar login o la app.
  const [isLoading, setIsLoading] = useState(true);

  // Auto-login: al abrir la app, si hay un token guardado recuperamos el perfil.
  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const token = await secureStorage.getItem("access_token");
        if (!token) return;
        const profile = await authService.me();
        if (mounted) setUser(profile);
      } catch {
        // Token inválido/expirado: lo limpiamos para no reintentar en bucle.
        await secureStorage.removeItem("access_token");
        await secureStorage.removeItem("refresh_token");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  async function login(username, password) {
    const tokens = await authService.login(username, password);
    await secureStorage.setItem("access_token", tokens.access_token);
    await secureStorage.setItem("refresh_token", tokens.refresh_token);
    // Llamada autenticada: prueba que el token guardado viaja en la cabecera.
    const profile = await authService.me();
    setUser(profile);
  }

  async function register(username, password) {
    // /auth/register devuelve { user, tokens }: registramos y entramos directo.
    const { user: profile, tokens } = await authService.register(username, password);
    await secureStorage.setItem("access_token", tokens.access_token);
    await secureStorage.setItem("refresh_token", tokens.refresh_token);
    setUser(profile);
  }

  async function logout() {
    await secureStorage.removeItem("access_token");
    await secureStorage.removeItem("refresh_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
