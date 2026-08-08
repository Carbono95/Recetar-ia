import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "../auth/AuthContext";

// Pantalla de login. Recoge usuario/contraseña y delega en login() del
// AuthContext, que autentica contra el core y guarda los tokens.
export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  async function submit() {
    setStatus("loading");
    setError(null);
    try {
      await login(username, password);
      // Si el login va bien, el RootNavigator cambia de pantalla y este se desmonta.
    } catch (err) {
      setError(err?.message ?? "No se pudo iniciar sesión");
      setStatus("error");
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>RecetarIA</Text>
      <Text style={styles.subtitle}>Inicia sesión para ver tus recetas</Text>

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
        onPress={submit}
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
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  error: { color: "#dc2626", fontSize: 15, marginTop: 16, textAlign: "center" },
});
