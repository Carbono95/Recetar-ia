// Adaptador de storage para navegador. Contrato async a propósito: así es idéntico
// al de expo-secure-store en móvil y el core no necesita saber en qué plataforma corre.
export const webStorage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};
