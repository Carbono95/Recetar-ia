import { useCallback, useEffect, useState } from "react";

import { notify } from "../services/notify";
import recipeService from "../services/recipeService";

export function useRecipes(filters = {}) {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recipeService.list(filters);
      setRecipes(data.items);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las recetas");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const deleteRecipe = async (recipeId) => {
    await recipeService.remove(recipeId);
    setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId));
  };

  const toggleFavorite = async (recipeId, isFavorite) => {
    const previousRecipes = recipes;
    setRecipes((current) =>
      current.map((recipe) => (recipe.id === recipeId ? { ...recipe, is_favorite: isFavorite } : recipe))
    );
    try {
      if (isFavorite) {
        await recipeService.addFavorite(recipeId);
      } else {
        await recipeService.removeFavorite(recipeId);
      }
    } catch (err) {
      setRecipes(previousRecipes);
      notify(err.message || "No se pudo actualizar el favorito");
    }
  };

  return { recipes, isLoading, error, deleteRecipe, toggleFavorite, refetch: fetchRecipes };
}

export default useRecipes;
