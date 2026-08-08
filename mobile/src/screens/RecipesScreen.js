import { useCallback, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRecipes } from "@recetaria/core";

import { useAuth } from "../auth/AuthContext";
import { API_URL } from "../config";

const DIFFICULTY_LABELS = { facil: "Fácil", media: "Media", dificil: "Difícil" };

// Primera pantalla real portada al móvil. Consume el hook useRecipes de
// @recetaria/core — el MISMO que usa la web — probando que compartir hooks
// (no solo services) funciona en React Native en runtime.
export function RecipesScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { recipes, isLoading, error, toggleFavorite, refetch } = useRecipes();

  // Al volver a la lista (p. ej. tras crear/editar/eliminar una receta) la
  // refrescamos. El primer foco lo salta porque el hook ya carga al montar.
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

  function renderItem({ item }) {
    const imageUrl = item.image_path ? `${API_URL}${item.image_path}` : null;
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("RecipeDetail", { recipeId: item.id, title: item.title })}
      >
        <View style={styles.thumbWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.placeholder]}>
              <Text style={styles.placeholderEmoji}>🍽️</Text>
            </View>
          )}
          <Pressable
            style={styles.favBtn}
            onPress={() => toggleFavorite(item.id, !item.is_favorite)}
            hitSlop={8}
          >
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
        <View>
          <Text style={styles.hello}>Hola, {user.username}</Text>
          <Text style={styles.headerSub}>Tus recetas</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate("RecipeForm")} hitSlop={8}>
            <Text style={styles.newBtn}>+ Nueva</Text>
          </Pressable>
          <Pressable onPress={logout} hitSlop={8}>
            <Text style={styles.logout}>Salir</Text>
          </Pressable>
        </View>
      </View>

      {isLoading && recipes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
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
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#16a34a" />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>Aún no hay recetas.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fffdf7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  hello: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  headerSub: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  newBtn: { fontSize: 15, fontWeight: "700", color: "#16a34a" },
  logout: { fontSize: 15, fontWeight: "600", color: "#dc2626" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, minHeight: 200 },
  error: { color: "#dc2626", fontSize: 15, textAlign: "center" },
  empty: { color: "#6b7280", fontSize: 15 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  thumbWrap: { height: 140, position: "relative" },
  thumb: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: "#eef2f7", alignItems: "center", justifyContent: "center" },
  placeholderEmoji: { fontSize: 40 },
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  favIcon: { fontSize: 16 },
  cardBody: { padding: 14, gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a1a", lineHeight: 21 },
  tagsRow: { flexDirection: "row", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 12, fontWeight: "700", overflow: "hidden" },
  tagTime: { backgroundColor: "#dcfce7", color: "#16a34a" },
  tagDiff: { backgroundColor: "#fef3c7", color: "#b45309" },
});
