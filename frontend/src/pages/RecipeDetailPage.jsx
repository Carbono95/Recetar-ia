import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import recipeService from "../services/recipeService";
import { getPlaceholderColor, PlacePlateIcon } from "../utils/recipePlaceholder.jsx";

const DIFFICULTY_LABELS = { facil: "Fácil", media: "Media", dificil: "Difícil" };

function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    recipeService
      .get(id)
      .then((data) => {
        if (isMounted) setRecipe(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "No se pudo cargar la receta");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta receta?")) return;
    await recipeService.remove(id);
    navigate("/recipes");
  };

  const toggleFavorite = async () => {
    try {
      const updated = recipe.is_favorite
        ? await recipeService.removeFavorite(id).then(() => ({ ...recipe, is_favorite: false }))
        : await recipeService.addFavorite(id);
      setRecipe(updated);
    } catch (err) {
      window.alert(err.message || "No se pudo actualizar el favorito");
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const updated = await recipeService.uploadImage(id, file);
      setRecipe(updated);
    } catch (err) {
      window.alert(err.message || "No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="p-6 text-sand-500">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!recipe) return null;

  const imageUrl = recipe.image_path ? `${import.meta.env.VITE_API_URL}${recipe.image_path}` : null;
  const canEdit = user && (user.id === recipe.user_id || user.role === "admin");

  return (
    <div className="max-w-narrow mx-auto p-6 pb-16">
      <button
        onClick={() => navigate("/recipes")}
        className="bg-transparent border-none text-sand-600 font-bold text-sm flex items-center gap-1.5 pb-4"
      >
        ← Volver
      </button>

      <div
        className="relative h-[220px] rounded-[20px] flex items-center justify-center mb-5"
        style={{ background: imageUrl ? undefined : getPlaceholderColor(recipe.id) }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={recipe.title} className="w-full h-full object-cover rounded-[20px]" />
        ) : (
          <PlacePlateIcon size={64} />
        )}
        {canEdit && (
          <label className="absolute bottom-3 right-3 px-3.5 py-2 rounded-xl bg-white/90 font-bold text-xs cursor-pointer">
            {isUploading ? "Subiendo..." : "Cambiar imagen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="font-heading font-extrabold text-2xl sm:text-[26px] text-ink">{recipe.title}</h1>
        <button
          onClick={toggleFavorite}
          aria-label={recipe.is_favorite ? "Quitar de favoritos" : "Marcar como favorita"}
          className="w-[42px] h-[42px] rounded-full border-none bg-white shadow-cardSm text-lg shrink-0"
        >
          {recipe.is_favorite ? "⭐" : "☆"}
        </button>
      </div>

      <div className="flex gap-2.5 mb-4">
        <div className="px-3.5 py-1.5 rounded-full bg-primary-50 text-primary-500 font-bold text-[13px]">
          ⏱ {recipe.time_min} min
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-accent-50 text-accent-500 font-bold text-[13px]">
          {DIFFICULTY_LABELS[recipe.difficulty]}
        </div>
      </div>

      {canEdit && (
        <div className="flex gap-2.5 mb-5">
          <button
            onClick={() => navigate(`/recipes/${id}/edit`)}
            className="px-4 py-2.5 rounded-xl border border-sand-200 bg-white font-bold text-[13px] text-sand-600"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl border border-red-200 bg-white font-bold text-[13px] text-red-600"
          >
            Eliminar
          </button>
        </div>
      )}

      {recipe.description && <p className="text-[15px] leading-relaxed text-[#4a4238] mb-6">{recipe.description}</p>}

      <h2 className="font-heading font-bold text-lg text-ink mb-3">Ingredientes</h2>
      <div className="flex flex-col">
        {recipe.ingredients.map((item) => (
          <div
            key={item.ingredient_name}
            className="flex items-center justify-between py-3 border-b border-sand-100"
          >
            <span className="text-sm font-semibold text-ink">{item.ingredient_name}</span>
            <span className="text-sm font-semibold text-sand-500">
              {item.quantity} {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecipeDetailPage;
