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
import { colors, fonts, shadows } from "../theme";
import { PlateIcon } from "../components/icons";

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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
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
        <ActivityIndicator size="large" color={colors.primary} />
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
  // Recetario compartido: cualquier usuario autenticado puede editar/eliminar/subir imagen.
  const canEdit = Boolean(user);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlate}>
            <PlateIcon size={80} color={colors.ink} />
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

      {/* Hoja de contenido que solapa el hero (estilo iOS) */}
      <View style={styles.sheet}>
        <Text style={styles.title}>{recipe.title}</Text>

        <View style={styles.tagsRow}>
          <Text style={[styles.tag, styles.tagTime]}>⏱ {recipe.time_min} min</Text>
          <Text style={[styles.tag, styles.tagDiff]}>
            {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}
          </Text>
        </View>

        {canEdit ? (
          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={() => navigation.navigate("RecipeForm", { recipeId })}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screen },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: colors.screen },
  error: { color: colors.danger, fontSize: 15, textAlign: "center" },
  hero: { height: 240, position: "relative", backgroundColor: "#fde0d0", alignItems: "center", justifyContent: "center" },
  heroImage: { width: "100%", height: "100%" },
  heroPlate: { opacity: 0.45 },
  favBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  favIcon: { fontSize: 19 },
  changeImgBtn: {
    position: "absolute",
    bottom: 40,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  changeImgText: { fontSize: 13, fontWeight: "700", color: colors.ink },
  sheet: {
    backgroundColor: colors.screen,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -26,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.ink, lineHeight: 30 },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  tag: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 100, fontSize: 13, fontWeight: "700", overflow: "hidden" },
  tagTime: { backgroundColor: colors.primaryTint, color: colors.primary },
  tagDiff: { backgroundColor: colors.accentTint, color: colors.accent },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1 },
  editBtn: { backgroundColor: colors.card, borderColor: colors.sand300 },
  editText: { fontSize: 14, fontWeight: "700", color: colors.sand600 },
  deleteBtn: { backgroundColor: colors.card, borderColor: "#fecaca" },
  deleteText: { fontSize: 14, fontWeight: "700", color: colors.danger },
  description: { fontSize: 15, lineHeight: 24, color: "#4a4238", marginTop: 16 },
  sectionTitle: { fontFamily: fonts.headingBold, fontSize: 19, color: colors.ink, marginTop: 22, marginBottom: 10 },
  ingredientsCard: { backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 16, ...shadows.ios },
  ingredientRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13 },
  ingredientBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  ingredientName: { fontSize: 15, fontWeight: "600", color: colors.ink },
  ingredientQty: { fontSize: 15, fontWeight: "600", color: colors.sand500 },
});
