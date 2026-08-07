import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { configureApi, setNotifier, authService } from "@recetaria/core";

import { secureStorage } from "./src/secureStorage";

// Cuando la IP DHCP de la máquina Windows cambie, actualiza esta constante.
// TODO (Fase 2): sacar la URL a config/env en vez de hardcodearla.
const API_URL = "http://192.168.1.134:8000";

// Configuración móvil del core: misma lógica que la web (main.jsx), inyectando
// el storage seguro del iPhone. Se hace una vez, al cargar el módulo.
configureApi({
  apiUrl: API_URL,
  storage: secureStorage,
  onUnauthorized: () => {
    // En la app real: navegar a la pantalla de login.
  },
});
setNotifier((message) => Alert.alert("RecetarIA", message));

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  async function handleLogin() {
    setStatus("loading");
    setError(null);
    try {
      const tokens = await authService.login(username, password);
      await secureStorage.setItem("access_token", tokens.access_token);
      await secureStorage.setItem("refresh_token", tokens.refresh_token);
      // Llamada autenticada: prueba que el token guardado viaja en la cabecera.
      const profile = await authService.me();
      setUser(profile);
      setStatus("ok");
    } catch (err) {
      setError(err?.message ?? "No se pudo iniciar sesión");
      setStatus("error");
    }
  }

  async function handleLogout() {
    await secureStorage.removeItem("access_token");
    await secureStorage.removeItem("refresh_token");
    setUser(null);
    setUsername("");
    setPassword("");
    setStatus("idle");
  }

  if (user) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Text style={styles.title}>RecetarIA</Text>
        <Text style={styles.ok}>✅ Sesión iniciada</Text>
        <Text style={styles.subtitle}>
          {user.username} · rol {user.role}
        </Text>
        <Pressable style={[styles.button, styles.logout]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>RecetarIA</Text>
      <Text style={styles.subtitle}>Fase 2: login E2E con @recetaria/core</Text>

      <TextInput
        style={styles.input}
        placeholder="Usuario"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={[styles.button, status === "loading" && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        )}
      </Pressable>

      {status === "error" && <Text style={styles.error}>❌ {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffdf7",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#1a1a1a" },
  subtitle: { fontSize: 15, color: "#6b7280", marginTop: 4, marginBottom: 28, textAlign: "center" },
  input: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  logout: { backgroundColor: "#dc2626", marginTop: 24 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  ok: { color: "#16a34a", fontSize: 18, fontWeight: "600", marginTop: 12 },
  error: { color: "#dc2626", fontSize: 15, marginTop: 16, textAlign: "center" },
});
