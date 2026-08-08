import { vi } from "vitest";

import { configureApi } from "../apiClient";

// Configura el cliente HTTP del core con una URL y storage de prueba.
export function setupApi() {
  configureApi({
    apiUrl: "http://test",
    storage: {
      getItem: async () => "token",
      setItem: async () => {},
      removeItem: async () => {},
    },
    onUnauthorized: () => {},
  });
}

// Simula global.fetch enrutando por "METODO url".
// routes: { "GET http://test/api/v1/shopping": { data, ok?, status? }, ... }
export function mockApi(routes) {
  global.fetch = vi.fn((url, opts) => {
    const method = (opts && opts.method) || "GET";
    const key = `${method} ${url}`;
    const route = routes[key];
    if (!route) return Promise.reject(new Error(`Sin mock para ${key}`));
    return Promise.resolve({
      ok: route.ok !== undefined ? route.ok : true,
      status: route.status !== undefined ? route.status : 200,
      json: async () => route.data,
    });
  });
}
