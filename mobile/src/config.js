// Configuración de la app móvil.
// La IP es la de la máquina Windows en la LAN; cambia con el DHCP del router.
// TODO: mover a variable de entorno (app.config.js + expo-constants) para no
// tocar código al cambiar de red. Debe emparejar con frontend/.env (VITE_API_URL).
export const API_URL = "http://192.168.1.134:8000";
