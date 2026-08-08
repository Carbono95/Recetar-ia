import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useShopping, recipeService } from "@recetaria/core";

// Lista de compra en el móvil. Reusa el hook useShopping de @recetaria/core
// (el mismo que la web) para cargar/generar/marcar/vaciar, y recipeService para
// el selector de recetas desde el que se genera la lista.
export function ShoppingListScreen() {
  const { items, isLoading, error, generateList, toggleChecked, clearList } = useShopping();
  const [recipes, setRecipes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    recipeService
      .list({ page: 1, size: 100 })
      .then((data) => setRecipes(data.items))
      .catch(() => {});
  }, []);

  function toggleRecipe(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }

  function handleGenerate() {
    if (selectedIds.length === 0) return;
    generateList(selectedIds);
  }

  function handleClear() {
    Alert.alert("Vaciar lista", "¿Seguro que quieres vaciar la lista de compra?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Vaciar", style: "destructive", onPress: () => clearList() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Lista de compra</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selecciona recetas</Text>
          {recipes.length === 0 ? (
            <Text style={styles.muted}>Aún no tienes recetas creadas.</Text>
          ) : (
            recipes.map((recipe) => {
              const selected = selectedIds.includes(recipe.id);
              return (
                <Pressable key={recipe.id} style={styles.recipeRow} onPress={() => toggleRecipe(recipe.id)}>
                  <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                    {selected && <Text style={styles.checkboxMark}>✓</Text>}
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
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Tu lista</Text>
            {items.length > 0 && (
              <Pressable onPress={handleClear} hitSlop={8}>
                <Text style={styles.clear}>Vaciar</Text>
              </Pressable>
            )}
          </View>

          {isLoading && items.length === 0 ? (
            <ActivityIndicator color="#16a34a" style={{ marginVertical: 16 }} />
          ) : error ? (
            <Text style={styles.error}>❌ {error}</Text>
          ) : items.length === 0 ? (
            <Text style={styles.muted}>Tu lista está vacía. Selecciona recetas y genera una lista.</Text>
          ) : (
            items.map((item, idx) => (
              <Pressable
                key={item.id}
                style={[styles.itemRow, idx < items.length - 1 && styles.itemBorder]}
                onPress={() => toggleChecked(item.id, !item.checked)}
              >
                <View style={[styles.circle, item.checked && styles.circleOn]}>
                  {item.checked && <Text style={styles.circleMark}>✓</Text>}
                </View>
                <Text style={[styles.itemText, item.checked && styles.itemChecked]}>
                  {item.total_quantity} {item.unit} de {item.ingredient_name}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fffdf7" },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#1a1a1a", marginBottom: 16 },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
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
  recipeTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", flexShrink: 1 },
  generateBtn: {
    marginTop: 14,
    backgroundColor: "#16a34a",
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  generateText: { color: "white", fontSize: 15, fontWeight: "700" },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  clear: { color: "#dc2626", fontSize: 14, fontWeight: "700" },
  error: { color: "#dc2626", fontSize: 15, marginVertical: 12 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: "#f1ede4" },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d8cdb8",
    alignItems: "center",
    justifyContent: "center",
  },
  circleOn: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  circleMark: { color: "white", fontSize: 13, fontWeight: "800" },
  itemText: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", flexShrink: 1 },
  itemChecked: { textDecorationLine: "line-through", color: "#b8ae9c" },
});
