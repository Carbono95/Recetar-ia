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

  const { recipes, isLoading, error, deleteRecipe, toggleFavorite } = useRecipes(filters);

  useEffect(() => {
    recipeService.listCategories().then(setCategories);
  }, []);

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setSearchParams(nextFilters.favoritesOnly ? { favorites: "true" } : {});
  };

  const handleDelete = async (recipeId) => {
    if (!window.confirm("¿Eliminar esta receta?")) return;
    try {
      await deleteRecipe(recipeId);
    } catch (err) {
      window.alert(err.message || "No se pudo eliminar la receta");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recetario</h1>
        <Link to="/recipes/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Nueva receta
        </Link>
      </div>

      <SearchBar filters={filters} categories={categories} onChange={handleFiltersChange} />

      {isLoading && <p>Cargando recetas...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && recipes.length === 0 && (
        <p className="text-gray-500">No se encontraron recetas con estos filtros.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onDelete={handleDelete} onToggleFavorite={toggleFavorite} />
        ))}
      </div>
    </div>
  );
}

export default RecipesPage;
