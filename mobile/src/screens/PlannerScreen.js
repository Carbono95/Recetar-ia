import { useEffect, useState } from "react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale/es";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMealPlan, recipeService } from "@recetaria/core";

const MEAL_TYPES = [
  { value: "comida", label: "Comida" },
  { value: "cena", label: "Cena" },
];

// Planner semanal en el móvil. Reusa useMealPlan de @recetaria/core (el mismo
// que la web) para la semana, las entradas y la navegación de semanas. El
// selector de receta de la web (<select>) se sustituye por un modal.
export function PlannerScreen({ navigation }) {
  const {
    weekStart,
    weekLabel,
    entries,
    isLoading,
    error,
    addEntry,
    removeEntry,
    generateShoppingList,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  } = useMealPlan();
  const [recipes, setRecipes] = useState([]);
  const [addTarget, setAddTarget] = useState(null); // { date, mealType } o null

  useEffect(() => {
    recipeService
      .list({ page: 1, size: 100 })
      .then((data) => setRecipes(data.items))
      .catch(() => {});
  }, []);

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  async function pickRecipe(recipeId) {
    const target = addTarget;
    setAddTarget(null);
    if (!target) return;
    try {
      await addEntry(recipeId, target.date, target.mealType);
    } catch (err) {
      Alert.alert("RecetarIA", err?.message ?? "No se pudo añadir la receta");
    }
  }

  async function handleRemove(entryId) {
    try {
      await removeEntry(entryId);
    } catch (err) {
      Alert.alert("RecetarIA", err?.message ?? "No se pudo quitar la receta");
    }
  }

  async function handleGenerate() {
    try {
      await generateShoppingList();
      Alert.alert("Planner", "Lista de compra semanal generada.", [
        { text: "Ver lista", onPress: () => navigation.navigate("ListaTab") },
        { text: "OK", style: "cancel" },
      ]);
    } catch (err) {
      Alert.alert("RecetarIA", err?.message ?? "No se pudo generar la lista semanal");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Planner semanal</Text>

        <View style={styles.weekNav}>
          <Pressable style={styles.navBtn} onPress={goToPreviousWeek}>
            <Text style={styles.navText}>← Anterior</Text>
          </Pressable>
          <Pressable style={styles.navBtn} onPress={goToCurrentWeek}>
            <Text style={styles.navText}>Hoy</Text>
          </Pressable>
          <Pressable style={styles.navBtn} onPress={goToNextWeek}>
            <Text style={styles.navText}>Siguiente →</Text>
          </Pressable>
        </View>

        <Text style={styles.weekRange}>
          Semana {weekLabel} · {format(weekStart, "d MMM", { locale: es })} –{" "}
          {format(addDays(weekStart, 6), "d MMM", { locale: es })}
        </Text>

        {error ? <Text style={styles.error}>❌ {error}</Text> : null}

        {days.map((date) => {
          const dateKey = format(date, "yyyy-MM-dd");
          const entriesForDay = entries.filter((entry) => entry.date === dateKey);
          return (
            <View key={dateKey} style={styles.dayCard}>
              <Text style={styles.dayLabel}>{format(date, "EEEE d", { locale: es })}</Text>
              {MEAL_TYPES.map((mealType) => {
                const entry = entriesForDay.find((item) => item.meal_type === mealType.value);
                return (
                  <View key={mealType.value} style={styles.mealRow}>
                    <Text style={styles.mealLabel}>{mealType.label}</Text>
                    {entry ? (
                      <View style={styles.entry}>
                        <Text style={styles.entryTitle} numberOfLines={1}>
                          {entry.recipe_title}
                        </Text>
                        <Pressable onPress={() => handleRemove(entry.id)} hitSlop={6}>
                          <Text style={styles.remove}>Quitar</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.addSlot}
                        onPress={() => setAddTarget({ date: dateKey, mealType: mealType.value })}
                      >
                        <Text style={styles.addSlotText}>+ Añadir receta</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        <Pressable
          style={[styles.generateBtn, entries.length === 0 && styles.btnDisabled]}
          onPress={handleGenerate}
          disabled={entries.length === 0 || isLoading}
        >
          <Text style={styles.generateText}>Generar lista de compra semanal</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={!!addTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setAddTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setAddTarget(null)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Elige una receta</Text>
            {recipes.length === 0 ? (
              <Text style={styles.muted}>Aún no tienes recetas creadas.</Text>
            ) : (
              <ScrollView style={styles.modalList}>
                {recipes.map((recipe) => (
                  <Pressable key={recipe.id} style={styles.modalRow} onPress={() => pickRecipe(recipe.id)}>
                    <Text style={styles.modalRowText}>{recipe.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <Pressable style={styles.modalCancel} onPress={() => setAddTarget(null)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fffdf7" },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#1a1a1a", marginBottom: 14 },
  weekNav: { flexDirection: "row", gap: 8, marginBottom: 10 },
  navBtn: { backgroundColor: "white", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  navText: { fontSize: 13, fontWeight: "700", color: "#6b7280" },
  weekRange: { fontSize: 13, fontWeight: "600", color: "#8a8172", marginBottom: 14 },
  error: { color: "#dc2626", fontSize: 15, marginBottom: 12 },
  dayCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dayLabel: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 8, textTransform: "capitalize" },
  mealRow: { marginBottom: 10 },
  mealLabel: { fontSize: 11, fontWeight: "700", color: "#a99f8c", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  entry: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f6f1e7", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  entryTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", flexShrink: 1, marginRight: 8 },
  remove: { fontSize: 12, fontWeight: "700", color: "#dc2626" },
  addSlot: { borderWidth: 1, borderColor: "#e5ddcd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  addSlotText: { fontSize: 14, fontWeight: "600", color: "#8a8172" },
  generateBtn: { marginTop: 6, backgroundColor: "#16a34a", paddingVertical: 15, borderRadius: 18, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  generateText: { color: "white", fontSize: 15, fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fffdf7", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "70%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 },
  muted: { color: "#8a8172", fontSize: 14, fontWeight: "500", marginVertical: 12 },
  modalList: { marginBottom: 12 },
  modalRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f1ede4" },
  modalRowText: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  modalCancel: { paddingVertical: 14, alignItems: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: "#dc2626" },
});
