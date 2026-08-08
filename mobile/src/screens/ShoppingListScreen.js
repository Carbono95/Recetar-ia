import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useShopping, recipeService } from "@recetaria/core";

import { colors, fonts } from "../theme";

// Lista de compra en el móvil. Reusa el hook useShopping de @recetaria/core
// (el mismo que la web) para cargar/generar/marcar/vaciar, y recipeService para
// el selector de recetas desde el que se genera la lista.
export function ShoppingListScreen() {
  const { items, isLoading, error, generateList, toggleChecked, clearList, addItem, removeItem } = useShopping();
  const [recipes, setRecipes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");

  useEffect(() => {
    recipeService
      .list({ page: 1, size: 100 })
      .then((data) => setRecipes(data.items))
      .catch(() => {});
  }, []);

  // El selector arranca abierto solo si aún no hay lista, para no estorbar.
  useEffect(() => {
    if (!isLoading) setSelectorOpen(items.length === 0);
  }, [isLoading, items.length]);

  const checkedCount = items.filter((item) => item.checked).length;
  const total = items.length;
  const progress = total > 0 ? checkedCount / total : 0;
  const allDone = total > 0 && checkedCount === total;

  function toggleRecipe(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }

  function handleGenerate() {
    if (selectedIds.length === 0) return;
    generateList(selectedIds);
    setSelectedIds([]);
  }

  function handleClear() {
    Alert.alert("Vaciar lista", "¿Seguro que quieres vaciar la lista de compra?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Vaciar", style: "destructive", onPress: () => clearList() },
    ]);
  }

  function handleAddItem() {
    const name = newName.trim();
    if (!name) return;
    addItem(name, newQty.trim());
    setNewName("");
    setNewQty("");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Lista de compra</Text>

        {/* Resumen de progreso cuando hay items */}
        {total > 0 ? (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {allDone ? "¡Todo comprado! 🎉" : `${checkedCount} de ${total} comprados`}
              </Text>
              <Pressable onPress={handleClear} hitSlop={8}>
                <Text style={styles.clear}>Vaciar</Text>
              </Pressable>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          </View>
        ) : null}

        {/* Selector de recetas plegable */}
        <View style={styles.card}>
          <Pressable style={styles.selectorHeader} onPress={() => setSelectorOpen((v) => !v)} hitSlop={6}>
            <Text style={styles.sectionTitle}>Añadir desde recetas</Text>
            <Text style={styles.chevron}>{selectorOpen ? "▲" : "▼"}</Text>
          </Pressable>

          {selectorOpen ? (
            <View style={styles.selectorBody}>
              {recipes.length === 0 ? (
                <Text style={styles.muted}>Aún no tienes recetas creadas.</Text>
              ) : (
                recipes.map((recipe) => {
                  const selected = selectedIds.includes(recipe.id);
                  return (
                    <Pressable key={recipe.id} style={styles.recipeRow} onPress={() => toggleRecipe(recipe.id)}>
                      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                        {selected ? <Text style={styles.checkboxMark}>✓</Text> : null}
                      </View>
                      <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    </Pressable>
                  );
                })
              )}
              <Pressable
                style={[styles.generateBtn, selectedIds.length === 0 && styles.btnDisabled]}
                onPress={handleGenerate}
                disabled={selectedIds.length === 0 || isLoading}
              >
                <Text style={styles.generateText}>Generar lista</Text>
                {selectedIds.length > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{selectedIds.length}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Añadir artículo a mano (no solo ingredientes de recetas) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Añadir artículo</Text>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, styles.addName]}
              placeholder="Ej. Detergente, pan…"
              placeholderTextColor={colors.sand400}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <TextInput
              style={[styles.addInput, styles.addQty]}
              placeholder="Cant."
              placeholderTextColor={colors.sand400}
              value={newQty}
              onChangeText={setNewQty}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <Pressable style={[styles.addBtn, !newName.trim() && styles.btnDisabled]} onPress={handleAddItem} disabled={!newName.trim()}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* La lista */}
        {isLoading && total === 0 ? (
          <ActivityIndicator color="#16a34a" style={{ marginVertical: 24 }} />
        ) : error ? (
          <Text style={styles.error}>❌ {error}</Text>
        ) : total === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyText}>Tu lista está vacía.</Text>
            <Text style={styles.emptyHint}>Genera una lista desde recetas o añade artículos a mano.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {items.map((item, idx) => (
              <Pressable
                key={item.id}
                style={[styles.itemRow, idx < items.length - 1 && styles.itemBorder]}
                onPress={() => toggleChecked(item.id, !item.checked)}
              >
                <View style={[styles.circle, item.checked && styles.circleOn]}>
                  {item.checked ? <Text style={styles.circleMark}>✓</Text> : null}
                </View>
                <View style={styles.itemBody}>
                  <Text style={[styles.itemName, item.checked && styles.itemChecked]}>
                    {item.ingredient_name}
                  </Text>
                  <Text style={[styles.itemQty, item.checked && styles.itemCheckedQty]}>
                    {item.total_quantity} {item.unit}
                  </Text>
                </View>
                <Pressable onPress={() => removeItem(item.id)} hitSlop={8} style={styles.itemDelete}>
                  <Text style={styles.itemDeleteText}>✕</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.screen },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontFamily: fonts.heading, fontSize: 34, color: colors.ink, marginBottom: 14 },

  progressCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 15, fontWeight: "700", color: colors.ink },
  clear: { color: "#dc2626", fontSize: 14, fontWeight: "700" },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#eee6d6", overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: "#16a34a" },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  selectorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.ink },
  chevron: { fontSize: 13, color: "#a99f8c", fontWeight: "700" },
  selectorBody: { marginTop: 12 },
  muted: { color: "#8a8172", fontSize: 14, fontWeight: "500" },
  recipeRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 7 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d8cdb8",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  checkboxMark: { color: "white", fontSize: 14, fontWeight: "800" },
  recipeTitle: { fontSize: 15, fontWeight: "600", color: colors.ink, flexShrink: 1 },
  generateBtn: {
    marginTop: 14,
    backgroundColor: "#16a34a",
    paddingVertical: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnDisabled: { opacity: 0.45 },
  generateText: { color: "white", fontSize: 15, fontWeight: "700" },
  countBadge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 999, minWidth: 24, paddingHorizontal: 7, paddingVertical: 2, alignItems: "center" },
  countText: { color: "white", fontSize: 13, fontWeight: "800" },

  error: { color: "#dc2626", fontSize: 15, marginVertical: 12 },

  empty: { alignItems: "center", paddingVertical: 36 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", color: colors.ink },
  emptyHint: { fontSize: 14, color: "#8a8172", marginTop: 4, textAlign: "center" },

  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: "#f1ede4" },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#d8cdb8",
    alignItems: "center",
    justifyContent: "center",
  },
  circleOn: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  circleMark: { color: "white", fontSize: 14, fontWeight: "800" },
  itemBody: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemName: { fontSize: 16, fontWeight: "600", color: colors.ink, flexShrink: 1, marginRight: 8 },
  itemChecked: { textDecorationLine: "line-through", color: "#b8ae9c" },
  itemQty: { fontSize: 14, fontWeight: "700", color: "#8a8172" },
  itemCheckedQty: { color: "#c4bba8" },
  itemDelete: { paddingLeft: 10 },
  itemDeleteText: { fontSize: 15, fontWeight: "800", color: colors.sand400 },

  addRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  addInput: {
    backgroundColor: "#faf8f2",
    borderWidth: 1,
    borderColor: "#eee6d6",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontSize: 15,
    color: colors.ink,
  },
  addName: { flex: 1 },
  addQty: { width: 66, textAlign: "center" },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 26, fontWeight: "400", lineHeight: 28, marginTop: -2 },
});
