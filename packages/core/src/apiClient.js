import { createApiClient } from "./createApiClient";

// Instancia única del cliente HTTP que usan los services. Cada plataforma la
// configura una vez al arrancar (web en main.jsx, móvil en App) inyectando su
// URL, su storage y su reacción al 401. Sigue el mismo patrón que notify():
// el core expone la lógica y la plataforma inyecta lo suyo.
//
// `api` es un export mutable a propósito: configureApi() lo reasigna y, gracias
// a los live bindings de ESM, los services que hacen `import { api }` ven la
// instancia ya configurada en el momento de la llamada.
export let api = null;

export function configureApi(config) {
  api = createApiClient(config);
  return api;
}
