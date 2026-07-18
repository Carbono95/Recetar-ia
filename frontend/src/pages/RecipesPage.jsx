import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import RecipeCard from "../components/RecipeCard.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { useRecipes } from "../hooks/useRecipes.js";
import recipeService from "../services/recipeService";

function RecipesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    favoritesOnly: searchParams.get("favorites") === "true" || undefined,
  });

  const { recipes, isLoading, error, toggleFavorite } = useRecipes(filters);

  useEffect(() => {
    recipeService.listCategories().then(setCategories);
  }, []);

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setSearchParams(nextFilters.favoritesOnly ? { favorites: "true" } : {});
  };

  const pageTitle = filters.favoritesOnly ? "Favoritos" : "Recetario";

  return (
    <div className="max-w-content mx-auto px-5 md:px-6 pt-3 md:pt-6 pb-6">
      <div className="flex items-center justify-between gap-3.5 mb-4">
        <h1 className="font-heading font-extrabold text-[32px] md:text-[34px] text-ink">{pageTitle}</h1>
        <Link
          to="/recipes/new"
          aria-label="Nueva receta"
          className="shrink-0 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white shadow-cta w-10 h-10 rounded-full md:w-auto md:h-auto md:px-[18px] md:py-2.5 md:rounded-xl md:shadow-none"
        >
          <span className="md:hidden text-[26px] leading-none -mt-0.5">+</span>
          <span className="hidden md:inline font-bold text-sm">+ Nueva receta</span>
        </Link>
      </div>

      <SearchBar filters={filters} categories={categories} onChange={handleFiltersChange} />

      {isLoading && <p className="text-sand-500">Cargando recetas...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && recipes.length === 0 && (
        <p className="text-center py-16 text-sand-400 font-semibold">No se encontraron recetas con estos filtros.</p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onToggleFavorite={toggleFavorite} />
        ))}
      </div>
    </div>
  );
}

export default RecipesPage;
