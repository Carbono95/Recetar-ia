import { useCallback, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRecipes } from "@recetaria/core";

import { useAuth } from "../auth/AuthContext";
import { API_URL } from "../config";
import { colors, fonts, shadows } from "../theme";
import { PlateIcon } from "../components/icons";

const DIFFICULTY_LABELS = { facil: "Fácil", media: "Media", dificil: "Difícil" };
// Fondos pastel que rotan por tarjeta, como en el diseño.
const CARD_TINTS = ["#fde8dc", "#e6f2e0", "#fdf0d8", "#e7eefb", "#f7e6f0"];

export function RecipesScreen({ navigation }) {
  const { logout } = useAuth();
  const { recipes, isLoading, error, toggleFavorite, refetch } = useRecipes();

  // Al volver a la lista (tras crear/editar/eliminar) la refrescamos. El primer
  // foco lo salta porque el hook ya carga al montar.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );

  function renderItem({ item, index }) {
    const imageUrl = item.image_path ? `${API_URL}${item.image_path}` : null;
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("RecipeDetail", { recipeId: item.id, title: item.title })}
      >
        <View style={[styles.thumbWrap, { backgroundColor: CARD_TINTS[index % CARD_TINTS.length] }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumb} />
          ) : (
            <View style={styles.plate}>
              <PlateIcon size={46} color={colors.ink} />
            </View>
          )}
          <Pressable style={styles.favBtn} onPress={() => toggleFavorite(item.id, !item.is_favorite)} hitSlop={8}>
            <Text style={styles.favIcon}>{item.is_favorite ? "⭐" : "☆"}</Text>
          </Pressable>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.tagsRow}>
            <Text style={[styles.tag, styles.tagTime]}>⏱ {item.time_min} min</Text>
            <Text style={[styles.tag, styles.tagDiff]}>
              {DIFFICULTY_LABELS[item.difficulty] ?? item.difficulty}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Recetario</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={logout} hitSlop={8}>
            <Text style={styles.logout}>Salir</Text>
          </Pressable>
          <Pressable style={styles.fab} onPress={() => navigation.navigate("RecipeForm")} hitSlop={6}>
            <Text style={styles.fabPlus}>+</Text>
          </Pressable>
        </View>
      </View>

      {isLoading && recipes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>❌ {error}</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(recipe) => String(recipe.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>Aún no hay recetas. Toca + para crear una.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.screen },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontFamily: fonts.heading, fontSize: 34, color: colors.ink },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  logout: { fontSize: 15, fontWeight: "600", color: colors.sand500 },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.cta,
  },
  fabPlus: { color: "#fff", fontSize: 28, fontWeight: "400", lineHeight: 30, marginTop: -2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, minHeight: 200 },
  error: { color: colors.danger, fontSize: 15, textAlign: "center" },
  empty: { color: colors.sand500, fontSize: 15, textAlign: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: 22, overflow: "hidden", ...shadows.ios },
  thumbWrap: { height: 130, position: "relative", alignItems: "center", justifyContent: "center" },
  thumb: { width: "100%", height: "100%" },
  plate: { opacity: 0.5 },
  favBtn: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  favIcon: { fontSize: 17 },
  cardBody: { paddingHorizontal: 15, paddingTop: 13, paddingBottom: 15 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.ink },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 9 },
  tag: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 100, fontSize: 12, fontWeight: "700", overflow: "hidden" },
  tagTime: { backgroundColor: colors.primaryTint, color: colors.primary },
  tagDiff: { backgroundColor: colors.accentTint, color: colors.accent },
});
