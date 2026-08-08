import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { recipeService } from "@recetaria/core";

import { API_URL } from "../config";

const DIFFICULTY_LABELS = { facil: "Fácil", media: "Media", dificil: "Difícil" };

// Detalle de una receta. Reusa recipeService.get de @recetaria/core (el mismo
// que la web). El recipeId llega por los params de navegación.
export function RecipeDetailScreen({ route }) {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    recipeService
      .get(recipeId)
      .then((data) => mounted && setRecipe(data))
      .catch((err) => mounted && setError(err?.message ?? "No se pudo cargar la receta"))
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, [recipeId]);

  async function toggleFavorite() {
    try {
      const updated = recipe.is_favorite
        ? await recipeService.removeFavorite(recipeId).then(() => ({ ...recipe, is_favorite: false }))
        : await recipeService.addFavorite(recipeId);
      setRecipe(updated);
    } catch {
      // notify() ya avisa por Alert en los flujos del core; aquí lo dejamos pasar.
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>❌ {error}</Text>
      </View>
    );
  }
  if (!recipe) return null;

  const imageUrl = recipe.image_path ? `${API_URL}${recipe.image_path}` : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.placeholder]}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}
        <Pressable style={styles.favBtn} onPress={toggleFavorite} hitSlop={8}>
          <Text style={styles.favIcon}>{recipe.is_favorite ? "⭐" : "☆"}</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{recipe.title}</Text>

      <View style={styles.tagsRow}>
        <Text style={[styles.tag, styles.tagTime]}>⏱ {recipe.time_min} min</Text>
        <Text style={[styles.tag, styles.tagDiff]}>
          {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}
        </Text>
      </View>

      {recipe.description ? <Text style={styles.description}>{recipe.description}</Text> : null}

      <Text style={styles.sectionTitle}>Ingredientes</Text>
      <View style={styles.ingredientsCard}>
        {recipe.ingredients?.map((item, idx) => (
          <View
            key={`${item.ingredient_name}-${idx}`}
            style={[styles.ingredientRow, idx < recipe.ingredients.length - 1 && styles.ingredientBorder]}
          >
            <Text style={styles.ingredientName}>{item.ingredient_name}</Text>
            <Text style={styles.ingredientQty}>
              {item.quantity} {item.unit}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffdf7" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: "#fffdf7" },
  error: { color: "#dc2626", fontSize: 15, textAlign: "center" },
  hero: { height: 220, borderRadius: 24, overflow: "hidden", position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: "#eef2f7", alignItems: "center", justifyContent: "center" },
  placeholderEmoji: { fontSize: 64 },
  favBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  favIcon: { fontSize: 18 },
  title: { fontSize: 26, fontWeight: "800", color: "#1a1a1a", marginTop: 18, lineHeight: 30 },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  tag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, fontSize: 13, fontWeight: "700", overflow: "hidden" },
  tagTime: { backgroundColor: "#dcfce7", color: "#16a34a" },
  tagDiff: { backgroundColor: "#fef3c7", color: "#b45309" },
  description: { fontSize: 15, lineHeight: 22, color: "#4a4238", marginTop: 16 },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: "#1a1a1a", marginTop: 24, marginBottom: 10 },
  ingredientsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  ingredientBorder: { borderBottomWidth: 1, borderBottomColor: "#f1ede4" },
  ingredientName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  ingredientQty: { fontSize: 15, fontWeight: "600", color: "#8a8172" },
});
