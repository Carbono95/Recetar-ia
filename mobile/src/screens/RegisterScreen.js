import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../auth/AuthContext";
import { colors, fonts, shadows } from "../theme";
import { Mascot } from "../components/icons";

// Pantalla de registro. Crea la cuenta vía register() del AuthContext, que
// además guarda los tokens y deja la sesión iniciada (auto-login).
export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const canSubmit = username.trim() && password && confirm && status !== "loading";

  function validate() {
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username.trim())) {
      return "El usuario debe tener 3+ caracteres (letras, números o _).";
    }
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (password !== confirm) return "Las contraseñas no coinciden.";
    return null;
  }

  async function submit() {
    if (!canSubmit) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      await register(username.trim(), password);
    } catch (err) {
      setError(err?.message ?? "No se pudo crear la cuenta");
      setStatus("error");
    }
  }

  return (
    <LinearGradient colors={[colors.cream, colors.creamDeep]} style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StatusBar style="dark" />

          <View style={styles.brand}>
            <Mascot size={92} />
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.tagline}>Únete a RecetarIA</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>USUARIO</Text>
              <TextInput
                style={styles.input}
                placeholder="elige un usuario"
                placeholderTextColor={colors.sand400}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="mínimo 8 caracteres"
                  placeholderTextColor={colors.sand400}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Text style={styles.toggle}>{showPassword ? "Ocultar" : "Mostrar"}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>REPITE LA CONTRASEÑA</Text>
              <TextInput
                style={styles.input}
                placeholder="repite la contraseña"
                placeholderTextColor={colors.sand400}
                secureTextEntry={!showPassword}
                value={confirm}
                onChangeText={setConfirm}
                onSubmitEditing={submit}
                returnKeyType="go"
              />
            </View>

            {status === "error" ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={submit} disabled={!canSubmit}>
              {status === "loading" ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
            </Pressable>
          </View>

          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.secondary}>
              ¿Ya tienes cuenta? <Text style={styles.secondaryStrong}>Inicia sesión</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 30, paddingVertical: 40 },
  brand: { alignItems: "center", marginBottom: 22 },
  title: { fontFamily: fonts.heading, fontSize: 30, color: colors.ink, marginTop: 10 },
  tagline: { fontSize: 15, fontWeight: "600", color: colors.sand500, marginTop: 4 },
  form: { width: "100%", gap: 12 },
  field: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  label: { fontSize: 12, fontWeight: "700", color: colors.sand400, marginBottom: 2 },
  input: { fontSize: 16, color: colors.ink, fontWeight: "500", paddingVertical: 2 },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, fontSize: 16, color: colors.ink, fontWeight: "500", paddingVertical: 2 },
  toggle: { fontSize: 13, fontWeight: "700", color: colors.primary },
  error: { color: colors.danger, fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 2 },
  button: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    ...shadows.cta,
  },
  buttonDisabled: { backgroundColor: "#a7d7b9", shadowOpacity: 0 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondary: { textAlign: "center", fontSize: 14, fontWeight: "500", color: colors.sand500, marginTop: 24 },
  secondaryStrong: { color: colors.primary, fontWeight: "700" },
});
