import { Link } from "react-router-dom";

import { getPlaceholderColor, PlacePlateIcon } from "../utils/recipePlaceholder.jsx";

const DIFFICULTY_LABELS = { facil: "Fácil", media: "Media", dificil: "Difícil" };

function RecipeCard({ recipe, onToggleFavorite }) {
  const imageUrl = recipe.image_path ? `${import.meta.env.VITE_API_URL}${recipe.image_path}` : null;

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block bg-white rounded-[22px] overflow-hidden shadow-ios hover:shadow-card transition-shadow"
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
      <div className="p-3.5 flex flex-col gap-2.5">
        <h3 className="font-extrabold text-[17px] text-ink leading-tight">{recipe.title}</h3>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-500 font-bold text-[12px]">
            ⏱ {recipe.time_min} min
          </span>
          <span className="px-2.5 py-1 rounded-full bg-accent-50 text-accent-500 font-bold text-[12px]">
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default RecipeCard;
