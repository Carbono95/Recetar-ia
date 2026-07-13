import { useState } from "react";

const DIFFICULTY_OPTIONS = [
  { value: "facil", label: "Fácil" },
  { value: "media", label: "Media" },
  { value: "dificil", label: "Difícil" },
];

const EMPTY_INGREDIENT = { ingredient_name: "", quantity: "", unit: "" };

function buildInitialState(initialValues) {
  return {
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    time_min: initialValues?.time_min ?? "",
    difficulty: initialValues?.difficulty ?? "facil",
    category_id: initialValues?.category_id ?? "",
    ingredients: initialValues?.ingredients?.length
      ? initialValues.ingredients.map((item) => ({ ...item }))
      : [{ ...EMPTY_INGREDIENT }],
  };
}

function RecipeForm({ initialValues, categories, onSubmit, isSubmitting, submitLabel = "Guardar" }) {
  const [formState, setFormState] = useState(() => buildInitialState(initialValues));
  const [error, setError] = useState(null);

  const updateField = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const updateIngredient = (index, field, value) => {
    setFormState((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addIngredientRow = () => {
    setFormState((current) => ({ ...current, ingredients: [...current.ingredients, { ...EMPTY_INGREDIENT }] }));
  };

  const removeIngredientRow = (index) => {
    setFormState((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      await onSubmit({
        title: formState.title,
        description: formState.description || null,
        time_min: Number(formState.time_min),
        difficulty: formState.difficulty,
        category_id: Number(formState.category_id),
        ingredients: formState.ingredients,
      });
    } catch (err) {
      setError(err.message || "No se pudo guardar la receta");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Título"
        value={formState.title}
        onChange={(event) => updateField("title", event.target.value)}
        className="w-full px-4 py-2 border rounded"
        required
      />

      <textarea
        placeholder="Descripción (opcional)"
        value={formState.description}
        onChange={(event) => updateField("description", event.target.value)}
        className="w-full px-4 py-2 border rounded"
        rows={3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Minutos"
          min="1"
          value={formState.time_min}
          onChange={(event) => updateField("time_min", event.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <select
          value={formState.difficulty}
          onChange={(event) => updateField("difficulty", event.target.value)}
          className="w-full px-4 py-2 border rounded"
        >
          {DIFFICULTY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <select
        value={formState.category_id}
        onChange={(event) => updateField("category_id", event.target.value)}
        className="w-full px-4 py-2 border rounded"
        required
      >
        <option value="" disabled>
          Selecciona una categoría
        </option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <div>
        <h3 className="font-semibold mb-2">Ingredientes</h3>
        <div className="space-y-2">
          {formState.ingredients.map((ingredient, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-center gap-2">
              <input
                type="text"
                placeholder="Ingrediente"
                value={ingredient.ingredient_name}
                onChange={(event) => updateIngredient(index, "ingredient_name", event.target.value)}
                className="px-3 py-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Cantidad"
                value={ingredient.quantity}
                onChange={(event) => updateIngredient(index, "quantity", event.target.value)}
                className="px-3 py-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Unidad"
                value={ingredient.unit}
                onChange={(event) => updateIngredient(index, "unit", event.target.value)}
                className="px-3 py-2 border rounded"
                required
              />
              <button
                type="button"
                onClick={() => removeIngredientRow(index)}
                disabled={formState.ingredients.length === 1}
                className="text-sm text-red-600 disabled:opacity-30"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addIngredientRow} className="mt-2 text-sm text-blue-600">
          + Añadir ingrediente
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

export default RecipeForm;
