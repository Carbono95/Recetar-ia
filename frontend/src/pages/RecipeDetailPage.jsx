import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { recipeService } from "@recetaria/core";

import { useAuth } from "../hooks/useAuth";
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
  // Recetario compartido: cualquier usuario autenticado puede editar/eliminar/subir
  // imagen en cualquier receta (el backend lo permite igual). Ver móvil RecipeDetailScreen.
  const canEdit = Boolean(user);

  return (
    <div className="max-w-narrow mx-auto pb-10">
      <div className="px-5 md:px-6 pt-3">
        <button
          onClick={() => navigate("/recipes")}
          className="bg-transparent border-none text-sand-600 font-bold text-sm flex items-center gap-1.5 pb-3"
        >
          ← Volver
        </button>
      </div>

      {/* Hero de la receta */}
      <div
        className="relative h-[240px] sm:h-[280px] mx-5 md:mx-6 rounded-[24px] overflow-hidden flex items-center justify-center"
        style={{ background: imageUrl ? undefined : getPlaceholderColor(recipe.id) }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <PlacePlateIcon size={72} />
        )}
        <button
          onClick={toggleFavorite}
          aria-label={recipe.is_favorite ? "Quitar de favoritos" : "Marcar como favorita"}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-lg shadow-cardSm"
        >
          {recipe.is_favorite ? "⭐" : "☆"}
        </button>
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

      {/* Hoja de contenido que solapa el hero (estilo iOS) */}
      <div className="relative -mt-6 bg-sand-50 rounded-t-[28px] px-5 md:px-6 pt-6">
        <h1 className="font-heading font-extrabold text-[26px] text-ink leading-tight">{recipe.title}</h1>

        <div className="flex flex-wrap gap-2 mt-3">
          <div className="px-3.5 py-1.5 rounded-full bg-primary-50 text-primary-500 font-bold text-[13px]">
            ⏱ {recipe.time_min} min
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-accent-50 text-accent-500 font-bold text-[13px]">
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2.5 mt-4">
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

        {recipe.description && <p className="text-[15px] leading-relaxed text-[#4a4238] mt-4">{recipe.description}</p>}

        <h2 className="font-heading font-bold text-[19px] text-ink mt-6 mb-2.5">Ingredientes</h2>
        <div className="bg-white rounded-[20px] px-4 shadow-ios">
          {recipe.ingredients.map((item, idx) => (
            <div
              key={item.ingredient_name}
              className={`flex items-center justify-between py-3.5 ${
                idx === recipe.ingredients.length - 1 ? "" : "border-b border-sand-100"
              }`}
            >
              <span className="text-[15px] font-semibold text-ink">{item.ingredient_name}</span>
              <span className="text-[15px] font-semibold text-sand-500">
                {item.quantity} {item.unit}
              </span>
            </div>
          ))}
        </div>

        <Link
          to={`/shopping?add=${id}`}
          className="block mt-5 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-[16px] text-center shadow-cta"
        >
          Añadir a la lista de compra
        </Link>
      </div>
    </div>
  );
}

export default RecipeDetailPage;
