import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const DIFFICULTY_LABELS = { facil: "Fácil", media: "Media", dificil: "Difícil" };

function RecipeCard({ recipe, onDelete, onToggleFavorite }) {
  const { user } = useAuth();
  const imageUrl = recipe.image_path ? `${import.meta.env.VITE_API_URL}${recipe.image_path}` : null;
  const canEdit = user && (user.id === recipe.user_id || user.role === "admin");

  return (
    <div className="relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => onToggleFavorite(recipe.id, !recipe.is_favorite)}
        aria-label={recipe.is_favorite ? "Quitar de favoritos" : "Marcar como favorita"}
        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-lg ${
          recipe.is_favorite ? "bg-yellow-400 text-white" : "bg-white/80 text-gray-400"
        }`}
      >
        ★
      </button>

      <Link to={`/recipes/${recipe.id}`}>
        <div className="h-40 bg-gray-100 flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-sm">Sin imagen</span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg">{recipe.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {recipe.time_min} min · {DIFFICULTY_LABELS[recipe.difficulty]}
          </p>
        </div>
      </Link>
      {canEdit && (
        <div className="px-4 pb-4 flex gap-3">
          <Link to={`/recipes/${recipe.id}/edit`} className="text-sm text-blue-600">
            Editar
          </Link>
          <button onClick={() => onDelete(recipe.id)} className="text-sm text-red-600">
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export default RecipeCard;
