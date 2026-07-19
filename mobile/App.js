import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

// Spike Fase 0: valida que el iPhone (Expo Go) llega al backend FastAPI por la IP LAN.
// Cuando la IP DHCP de la maquina Windows cambie, actualiza esta constante.
const API_URL = "http://192.168.1.134:8000";

export default function App() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  async function checkBackend() {
    setStatus("loading");
    setResult(null);
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      setResult(JSON.stringify(data));
      setStatus("ok");
    } catch (error) {
      setResult(String(error?.message ?? error));
      setStatus("error");
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>RecetarIA — Spike iOS</Text>
      <Text style={styles.subtitle}>Fase 0: Expo Go + red al backend</Text>

      <Pressable style={styles.button} onPress={checkBackend}>
        <Text style={styles.buttonText}>Probar backend (/health)</Text>
      </Pressable>

      {status === "loading" && <ActivityIndicator style={styles.spacer} />}

      {status === "ok" && (
        <Text style={[styles.result, styles.ok]}>✅ Conectado: {result}</Text>
      )}
      {status === "error" && (
        <Text style={[styles.result, styles.error]}>❌ Error: {result}</Text>
      )}
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
  title: { fontSize: 24, fontWeight: "700", color: "#1a1a1a" },
  subtitle: { fontSize: 15, color: "#6b7280", marginTop: 4, marginBottom: 32 },
  button: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  spacer: { marginTop: 24 },
  result: { marginTop: 24, fontSize: 15, textAlign: "center" },
  ok: { color: "#16a34a" },
  error: { color: "#dc2626" },
});
