import { Link } from "react-router-dom";

import { getPlaceholderColor, PlacePlateIcon } from "../utils/recipePlaceholder.jsx";

const DIFFICULTY_LABELS = { facil: "Fácil", media: "Media", dificil: "Difícil" };

function RecipeCard({ recipe, onToggleFavorite }) {
  const imageUrl = recipe.image_path ? `${import.meta.env.VITE_API_URL}${recipe.image_path}` : null;

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block bg-white rounded-[18px] overflow-hidden shadow-cardSm hover:shadow-card transition-shadow"
    >
      <div
        className="relative h-[140px] flex items-center justify-center"
        style={{ background: imageUrl ? undefined : getPlaceholderColor(recipe.id) }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <PlacePlateIcon size={44} />
        )}
        <button
          onClick={(event) => {
            event.preventDefault();
            onToggleFavorite(recipe.id, !recipe.is_favorite);
          }}
          aria-label={recipe.is_favorite ? "Quitar de favoritos" : "Marcar como favorita"}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-base"
        >
          {recipe.is_favorite ? "⭐" : "☆"}
        </button>
      </div>
      <div className="p-3.5 flex flex-col gap-1.5">
        <h3 className="font-extrabold text-[15px] text-ink">{recipe.title}</h3>
        <div className="text-xs font-semibold text-sand-500 flex gap-2.5">
          <span>⏱ {recipe.time_min} min</span>
          <span>{DIFFICULTY_LABELS[recipe.difficulty]}</span>
        </div>
      </div>
    </Link>
  );
}

export default RecipeCard;
