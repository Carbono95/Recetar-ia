import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import recipeService from "../services/recipeService";

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

  if (isLoading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!recipe) return null;

  const imageUrl = recipe.image_path ? `${import.meta.env.VITE_API_URL}${recipe.image_path}` : null;
  const canEdit = user && (user.id === recipe.user_id || user.role === "admin");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFavorite}
            aria-label={recipe.is_favorite ? "Quitar de favoritos" : "Marcar como favorita"}
            className={`text-xl ${recipe.is_favorite ? "text-yellow-500" : "text-gray-300"}`}
          >
            ★
          </button>
          {canEdit && (
            <>
              <button onClick={() => navigate(`/recipes/${id}/edit`)} className="text-blue-600">
                Editar
              </button>
              <button onClick={handleDelete} className="text-red-600">
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {imageUrl ? (
        <img src={imageUrl} alt={recipe.title} className="w-full max-h-80 object-cover rounded mb-4" />
      ) : (
        <div className="w-full h-40 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-400">
          Sin imagen
        </div>
      )}

      {canEdit && (
        <label className="block text-sm text-blue-600 mb-6 cursor-pointer">
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

      <p className="text-gray-600 mb-4">
        {recipe.time_min} min · {DIFFICULTY_LABELS[recipe.difficulty]}
      </p>

      {recipe.description && <p className="mb-6">{recipe.description}</p>}

      <h2 className="text-xl font-semibold mb-2">Ingredientes</h2>
      <ul className="list-disc list-inside space-y-1">
        {recipe.ingredients.map((item) => (
          <li key={item.ingredient_name}>
            {item.quantity} {item.unit} de {item.ingredient_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecipeDetailPage;
