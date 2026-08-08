import { useEffect, useState } from "react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale/es";
import { StatusBar } from "expo-status-bar";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMealPlan, recipeService } from "@recetaria/core";

import { colors, fonts } from "../theme";

const MEAL_TYPES = [
  { value: "comida", label: "Comida", icon: "☀️" },
  { value: "cena", label: "Cena", icon: "🌙" },
];

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Vista "Semana": planner semanal en el móvil. Reusa useMealPlan de
// @recetaria/core (el mismo que la web) para la semana, las entradas y la
// navegación de semanas. El selector de receta se resuelve con un modal.
export function PlannerScreen({ navigation }) {
  const {
    weekStart,
    entries,
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
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const isCurrentWeek = days.some((date) => format(date, "yyyy-MM-dd") === todayKey);

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
      Alert.alert("Semana", "Lista de compra de la semana generada.", [
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Semana</Text>

        {/* Selector de semana: flechas a los lados y el rango en el centro */}
        <View style={styles.weekSwitcher}>
          <Pressable style={styles.arrow} onPress={goToPreviousWeek} hitSlop={8}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <View style={styles.weekCenter}>
            <Text style={styles.weekRange}>
              {format(weekStart, "d MMM", { locale: es })} – {format(addDays(weekStart, 6), "d MMM", { locale: es })}
            </Text>
            {isCurrentWeek ? (
              <Text style={styles.weekTag}>Esta semana</Text>
            ) : (
              <Pressable onPress={goToCurrentWeek} hitSlop={6}>
                <Text style={styles.weekToday}>Ir a hoy</Text>
              </Pressable>
            )}
          </View>
          <Pressable style={styles.arrow} onPress={goToNextWeek} hitSlop={8}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>❌ {error}</Text> : null}

        {days.map((date) => {
          const dateKey = format(date, "yyyy-MM-dd");
          const isToday = dateKey === todayKey;
          const entriesForDay = entries.filter((entry) => entry.date === dateKey);
          return (
            <View key={dateKey} style={[styles.dayCard, isToday && styles.dayCardToday]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                  {capitalize(format(date, "EEEE", { locale: es }))}
                </Text>
                <View style={styles.dayRight}>
                  {isToday ? (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>HOY</Text>
                    </View>
                  ) : null}
                  <Text style={styles.dayNum}>{format(date, "d MMM", { locale: es })}</Text>
                </View>
              </View>

              {MEAL_TYPES.map((mealType) => {
                const entry = entriesForDay.find((item) => item.meal_type === mealType.value);
                return (
                  <View key={mealType.value} style={styles.mealRow}>
                    <Text style={styles.mealIcon}>{mealType.icon}</Text>
                    <View style={styles.mealBody}>
                      <Text style={styles.mealLabel}>{mealType.label}</Text>
                      {entry ? (
                        <View style={styles.entry}>
                          <Text style={styles.entryTitle} numberOfLines={1}>
                            {entry.recipe_title}
                          </Text>
                          <Pressable onPress={() => handleRemove(entry.id)} hitSlop={8}>
                            <Text style={styles.remove}>✕</Text>
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
                  </View>
                );
              })}
            </View>
          );
        })}

        <Pressable
          style={[styles.generateBtn, entries.length === 0 && styles.btnDisabled]}
          onPress={handleGenerate}
          disabled={entries.length === 0}
        >
          <Text style={styles.generateText}>🛒 Generar lista de la semana</Text>
          {entries.length > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{entries.length}</Text>
            </View>
          ) : null}
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
            <View style={styles.modalHandle} />
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
  safe: { flex: 1, backgroundColor: colors.screen },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontFamily: fonts.heading, fontSize: 34, color: colors.ink, marginBottom: 14 },

  weekSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  arrow: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#f6f1e7" },
  arrowText: { fontSize: 24, fontWeight: "700", color: "#16a34a", lineHeight: 26 },
  weekCenter: { alignItems: "center", flex: 1 },
  weekRange: { fontSize: 16, fontWeight: "700", color: colors.ink },
  weekTag: { fontSize: 12, fontWeight: "700", color: "#16a34a", marginTop: 2 },
  weekToday: { fontSize: 12, fontWeight: "700", color: "#b45309", marginTop: 2 },

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
  dayCardToday: { borderWidth: 2, borderColor: "#16a34a" },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1ede4",
  },
  dayName: { fontSize: 16, fontWeight: "800", color: colors.ink },
  dayNameToday: { color: "#16a34a" },
  dayRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  todayBadge: { backgroundColor: "#16a34a", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  todayBadgeText: { color: "white", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  dayNum: { fontSize: 13, fontWeight: "600", color: "#a99f8c" },

  mealRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  mealIcon: { fontSize: 18, width: 24, textAlign: "center" },
  mealBody: { flex: 1 },
  mealLabel: { fontSize: 11, fontWeight: "700", color: "#a99f8c", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f7f1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  entryTitle: { fontSize: 14, fontWeight: "700", color: "#166534", flexShrink: 1, marginRight: 8 },
  remove: { fontSize: 15, fontWeight: "800", color: "#dc2626" },
  addSlot: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d8cdb8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addSlotText: { fontSize: 14, fontWeight: "600", color: "#8a8172" },

  generateBtn: {
    marginTop: 6,
    backgroundColor: "#16a34a",
    paddingVertical: 15,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnDisabled: { opacity: 0.45 },
  generateText: { color: "white", fontSize: 15, fontWeight: "700" },
  countBadge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 999, minWidth: 24, paddingHorizontal: 7, paddingVertical: 2, alignItems: "center" },
  countText: { color: "white", fontSize: 13, fontWeight: "800" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fffdf7", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "70%" },
  modalHandle: { alignSelf: "center", width: 40, height: 5, borderRadius: 999, backgroundColor: "#e5ddcd", marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 12 },
  muted: { color: "#8a8172", fontSize: 14, fontWeight: "500", marginVertical: 12 },
  modalList: { marginBottom: 12 },
  modalRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f1ede4" },
  modalRowText: { fontSize: 16, fontWeight: "600", color: colors.ink },
  modalCancel: { paddingVertical: 14, alignItems: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: "#dc2626" },
});
