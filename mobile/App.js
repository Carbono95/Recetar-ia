import { useState } from "react";
import { Alert } from "react-native";
import { configureApi, setNotifier, authService } from "@recetaria/core";

import { secureStorage } from "./src/secureStorage";
import { API_URL } from "./src/config";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RecipesScreen } from "./src/screens/RecipesScreen";

// Configuración móvil del core: misma lógica que la web (main.jsx), inyectando
// el storage seguro del iPhone. Se hace una vez, al cargar el módulo.
configureApi({
  apiUrl: API_URL,
  storage: secureStorage,
  onUnauthorized: () => {
    // En la app real: navegar a login. De momento el logout es manual.
  },
});
setNotifier((message) => Alert.alert("RecetarIA", message));

export default function App() {
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

  return user ? (
    <RecipesScreen user={user} onLogout={logout} />
  ) : (
    <LoginScreen onLogin={login} />
  );
}
