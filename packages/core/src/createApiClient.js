// Cliente HTTP agnóstico de plataforma. No usa APIs del navegador ni de Vite:
// recibe por inyección la URL base, el storage (async) y qué hacer ante un 401.
// Esto permite compartir exactamente este archivo entre la web (localStorage) y
// el móvil (expo-secure-store).
export function createApiClient({ apiUrl, storage, onUnauthorized }) {
  async function authHeaders() {
    const token = await storage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function handleResponse(response) {
    if (response.status === 401) {
      await storage.removeItem("access_token");
      await storage.removeItem("refresh_token");
      onUnauthorized?.();
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // El backend siempre responde { detail: "..." } en errores (ver CLAUDE.md)
      throw new Error(data?.detail || "Error de conexión con el servidor");
    }

    return data;
  }

  async function request(method, url, body) {
    const response = await fetch(`${apiUrl}${url}`, {
      method,
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  }

  // El objeto `file` lo construye cada plataforma: en web es un File del navegador;
  // en móvil, un { uri, name, type }. La factoría solo lo adjunta al FormData.
  async function uploadFile(url, file) {
    const formData = new FormData();
    formData.append("file", file);

    // Sin Content-Type manual: el runtime fija el boundary correcto del multipart
    const response = await fetch(`${apiUrl}${url}`, {
      method: "POST",
      headers: await authHeaders(),
      body: formData,
    });
    return handleResponse(response);
  }

  return {
    get: (url) => request("GET", url),
    post: (url, body) => request("POST", url, body),
    put: (url, body) => request("PUT", url, body),
    patch: (url, body) => request("PATCH", url, body),
    del: (url) => request("DELETE", url),
    uploadFile,
  };
}
