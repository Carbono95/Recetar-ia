import { useEffect, useState } from "react";
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
import { recipeService } from "@recetaria/core";

import { colors } from "../theme";

const DIFFICULTY_OPTIONS = [
  { value: "facil", label: "Fácil" },
  { value: "media", label: "Media" },
  { value: "dificil", label: "Difícil" },
];
const EMPTY_INGREDIENT = { ingredient_name: "", quantity: "", unit: "" };

// Formulario de crear/editar receta. Reusa recipeService del core
// (listCategories, get, create, update). Sin imagen: como en la web, la imagen
// se cambia desde el detalle. recipeId en params => modo edición.
export function RecipeFormScreen({ route, navigation }) {
  const recipeId = route.params?.recipeId;
  const isEditing = Boolean(recipeId);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    time_min: "",
    difficulty: "facil",
    category_id: "",
    ingredients: [{ ...EMPTY_INGREDIENT }],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? "Editar receta" : "Nueva receta" });
    let mounted = true;
    (async () => {
      try {
        const [cats, recipe] = await Promise.all([
          recipeService.listCategories(),
          isEditing ? recipeService.get(recipeId) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setCategories(cats);
        if (recipe) {
          setForm({
            title: recipe.title ?? "",
            description: recipe.description ?? "",
            time_min: recipe.time_min != null ? String(recipe.time_min) : "",
            difficulty: recipe.difficulty ?? "facil",
            category_id: recipe.category_id ?? recipe.category?.id ?? "",
            ingredients: recipe.ingredients?.length
              ? recipe.ingredients.map((i) => ({
                  ingredient_name: i.ingredient_name,
                  quantity: String(i.quantity),
                  unit: i.unit,
                }))
              : [{ ...EMPTY_INGREDIENT }],
          });
        }
      } catch (err) {
        if (mounted) setError(err?.message ?? "No se pudo cargar el formulario");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [recipeId, isEditing, navigation]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setIngredient(index, key, value) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((it, i) => (i === index ? { ...it, [key]: value } : it)),
    }));
  }
  function addIngredient() {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { ...EMPTY_INGREDIENT }] }));
  }
  function removeIngredient(index) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== index) }));
  }

  async function handleSubmit() {
    setError(null);
    if (!form.title.trim()) return setError("El título es obligatorio");
    if (!form.time_min || Number(form.time_min) <= 0) return setError("Indica los minutos");
    if (!form.category_id) return setError("Selecciona una categoría");
    const ingredients = form.ingredients.filter((i) => i.ingredient_name.trim());
    if (ingredients.length === 0) return setError("Añade al menos un ingrediente");

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        time_min: Number(form.time_min),
        difficulty: form.difficulty,
        category_id: Number(form.category_id),
        ingredients,
      };
      const saved = isEditing
        ? await recipeService.update(recipeId, payload)
        : await recipeService.create(payload);
      if (isEditing) {
        // Volvemos al detalle previo, que se refresca al enfocarse.
        navigation.goBack();
      } else {
        // Reemplazamos el form por el detalle (fresco) de la receta creada.
        navigation.replace("RecipeDetail", { recipeId: saved.id, title: saved.title });
      }
    } catch (err) {
      setError(err?.message ?? "No se pudo guardar la receta");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Título de la receta"
          value={form.title}
          onChangeText={(v) => setField("title", v)}
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Descripción (opcional)"
          value={form.description}
          onChangeText={(v) => setField("description", v)}
          multiline
        />

        <Text style={styles.label}>Minutos</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 30"
          keyboardType="number-pad"
          value={form.time_min}
          onChangeText={(v) => setField("time_min", v.replace(/[^0-9]/g, ""))}
        />

        <Text style={styles.label}>Dificultad</Text>
        <View style={styles.segment}>
          {DIFFICULTY_OPTIONS.map((option) => {
            const active = form.difficulty === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => setField("difficulty", option.value)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chips}>
          {categories.map((cat) => {
            const active = Number(form.category_id) === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setField("category_id", cat.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Ingredientes</Text>
        {form.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientRow}>
            <TextInput
              style={[styles.input, styles.ingredientName]}
              placeholder="Ingrediente"
              value={ingredient.ingredient_name}
              onChangeText={(v) => setIngredient(index, "ingredient_name", v)}
            />
            <TextInput
              style={[styles.input, styles.ingredientSmall]}
              placeholder="Cant."
              value={ingredient.quantity}
              onChangeText={(v) => setIngredient(index, "quantity", v)}
            />
            <TextInput
              style={[styles.input, styles.ingredientSmall]}
              placeholder="Unidad"
              value={ingredient.unit}
              onChangeText={(v) => setIngredient(index, "unit", v)}
            />
            <Pressable
              onPress={() => removeIngredient(index)}
              disabled={form.ingredients.length === 1}
              hitSlop={6}
            >
              <Text style={[styles.removeIng, form.ingredients.length === 1 && styles.removeIngDisabled]}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={addIngredient} hitSlop={6}>
          <Text style={styles.addIngredient}>+ Añadir ingrediente</Text>
        </Pressable>

        {error ? <Text style={styles.error}>❌ {error}</Text> : null}

        <Pressable
          style={[styles.submit, isSubmitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitText}>{isEditing ? "Guardar cambios" : "Crear receta"}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.screen },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.screen },
  label: { fontSize: 14, fontWeight: "700", color: "#4a4238", marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5ddcd",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1a1a1a",
  },
  textarea: { height: 84, textAlignVertical: "top" },
  segment: { flexDirection: "row", gap: 8 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#e5ddcd", alignItems: "center", backgroundColor: "white" },
  segmentBtnActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  segmentText: { fontSize: 14, fontWeight: "700", color: "#8a8172" },
  segmentTextActive: { color: "white" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: "#e5ddcd", backgroundColor: "white" },
  chipActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  chipText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  chipTextActive: { color: "white" },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  ingredientName: { flex: 2 },
  ingredientSmall: { flex: 1 },
  removeIng: { fontSize: 18, fontWeight: "800", color: "#dc2626", paddingHorizontal: 4 },
  removeIngDisabled: { color: "#d8cdb8" },
  addIngredient: { fontSize: 14, fontWeight: "700", color: "#16a34a", marginTop: 4 },
  error: { color: "#dc2626", fontSize: 15, marginTop: 16 },
  submit: { marginTop: 22, backgroundColor: "#16a34a", paddingVertical: 15, borderRadius: 16, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  submitText: { color: "white", fontSize: 16, fontWeight: "700" },
});
