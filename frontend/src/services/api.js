const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
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
  const response = await fetch(`${API_URL}${url}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse(response);
}

async function uploadFile(url, file) {
  const formData = new FormData();
  formData.append("file", file);

  // Sin Content-Type manual: el navegador fija el boundary correcto del multipart
  const response = await fetch(`${API_URL}${url}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(response);
}

const api = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body),
  put: (url, body) => request("PUT", url, body),
  patch: (url, body) => request("PATCH", url, body),
  del: (url) => request("DELETE", url),
  uploadFile,
};

export default api;
