import { createApiClient } from "./createApiClient";
import { webStorage } from "./webStorage";

// Instancia web del cliente HTTP: inyecta la config específica del navegador
// (URL de Vite, storage sobre localStorage, redirección a /login ante un 401).
// La lógica en sí vive en createApiClient.js, que se comparte con el móvil.
const api = createApiClient({
  apiUrl: import.meta.env.VITE_API_URL,
  storage: webStorage,
  onUnauthorized: () => {
    window.location.href = "/login";
  },
});

export default api;
