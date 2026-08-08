import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { recipeService } from "@recetaria/core";

import { useAuth } from "../auth/AuthContext";
import { API_URL } from "../config";

const DIFFICULTY_LABELS = { facil: "Fácil", media: "Media", dificil: "Difícil" };

// Construye el objeto de fichero que React Native adjunta al FormData (lo que
// createApiClient.uploadFile espera): { uri, name, type }.
function assetToFile(asset) {
  const uri = asset.uri;
  const name = asset.fileName || uri.split("/").pop() || `receta-${Date.now()}.jpg`;
  let type = asset.mimeType;
  if (!type) {
    const ext = (name.split(".").pop() || "jpg").toLowerCase();
    type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  }
  return { uri, name, type };
}

// Detalle de una receta. Reusa recipeService.get de @recetaria/core. El recipeId
// llega por los params de navegación. Recarga al enfocarse para reflejar las
// ediciones al volver del formulario.
export function RecipeDetailScreen({ route, navigation }) {
  const { recipeId } = route.params;
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    let active = true;
    setIsLoading(true);
    recipeService
      .get(recipeId)
      .then((data) => active && setRecipe(data))
      .catch((err) => active && setError(err?.message ?? "No se pudo cargar la receta"))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [recipeId]);

  useFocusEffect(load);

  async function toggleFavorite() {
    try {
      const updated = recipe.is_favorite
        ? await recipeService.removeFavorite(recipeId).then(() => ({ ...recipe, is_favorite: false }))
        : await recipeService.addFavorite(recipeId);
      setRecipe(updated);
    } catch {
      // notify() ya avisa por Alert en los flujos del core.
    }
  }

  async function changeImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso necesario", "Permite el acceso a tus fotos para cambiar la imagen.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled) return;

    setIsUploading(true);
    try {
      const updated = await recipeService.uploadImage(recipeId, assetToFile(result.assets[0]));
      setRecipe(updated);
    } catch (err) {
      Alert.alert("RecetarIA", err?.message ?? "No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDelete() {
    Alert.alert("Eliminar receta", "¿Seguro que quieres eliminar esta receta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await recipeService.remove(recipeId);
            navigation.goBack();
          } catch (err) {
            Alert.alert("RecetarIA", err?.message ?? "No se pudo eliminar la receta");
          }
        },
      },
    ]);
  }

  if (isLoading && !recipe) {
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
  const canEdit = user && (user.id === recipe.user_id || user.role === "admin");

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
        {canEdit ? (
          <Pressable style={styles.changeImgBtn} onPress={changeImage} disabled={isUploading}>
            <Text style={styles.changeImgText}>{isUploading ? "Subiendo…" : "Cambiar imagen"}</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.title}>{recipe.title}</Text>

      <View style={styles.tagsRow}>
        <Text style={[styles.tag, styles.tagTime]}>⏱ {recipe.time_min} min</Text>
        <Text style={[styles.tag, styles.tagDiff]}>
          {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}
        </Text>
      </View>

      {canEdit ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate("RecipeForm", { recipeId })}
          >
            <Text style={styles.editText}>Editar</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
            <Text style={styles.deleteText}>Eliminar</Text>
          </Pressable>
        </View>
      ) : null}

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
  changeImgBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  changeImgText: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  title: { fontSize: 26, fontWeight: "800", color: "#1a1a1a", marginTop: 18, lineHeight: 30 },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  tag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, fontSize: 13, fontWeight: "700", overflow: "hidden" },
  tagTime: { backgroundColor: "#dcfce7", color: "#16a34a" },
  tagDiff: { backgroundColor: "#fef3c7", color: "#b45309" },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1 },
  editBtn: { backgroundColor: "white", borderColor: "#e5ddcd" },
  editText: { fontSize: 14, fontWeight: "700", color: "#4a4238" },
  deleteBtn: { backgroundColor: "white", borderColor: "#fecaca" },
  deleteText: { fontSize: 14, fontWeight: "700", color: "#dc2626" },
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
