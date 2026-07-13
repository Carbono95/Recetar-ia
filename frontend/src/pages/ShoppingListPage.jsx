import { useEffect, useState } from "react";

import ShoppingListItem from "../components/ShoppingListItem.jsx";
import { useShopping } from "../hooks/useShopping.js";
import recipeService from "../services/recipeService";

function ShoppingListPage() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const { items, isLoading, error, generateList, toggleChecked, clearList } = useShopping();

  useEffect(() => {
    recipeService
      .list({ page: 1, size: 100 })
      .then((data) => setRecipes(data.items))
      .finally(() => setIsLoadingRecipes(false));
  }, []);

  const toggleRecipeSelection = (recipeId) => {
    setSelectedRecipeIds((current) =>
      current.includes(recipeId) ? current.filter((id) => id !== recipeId) : [...current, recipeId]
    );
  };

  const handleGenerate = () => {
    if (selectedRecipeIds.length === 0) return;
    generateList(selectedRecipeIds);
  };

  const handleClear = async () => {
    if (!window.confirm("¿Vaciar la lista de compra?")) return;
    await clearList();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Lista de compra</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Selecciona recetas</h2>
        {isLoadingRecipes && <p>Cargando recetas...</p>}
        {!isLoadingRecipes && recipes.length === 0 && (
          <p className="text-gray-500">Aún no tienes recetas creadas.</p>
        )}
        <div className="space-y-1 mb-3">
          {recipes.map((recipe) => (
            <label key={recipe.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedRecipeIds.includes(recipe.id)}
                onChange={() => toggleRecipeSelection(recipe.id)}
              />
              {recipe.title}
            </label>
          ))}
        </div>
        <button
          onClick={handleGenerate}
          disabled={selectedRecipeIds.length === 0 || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Generar lista
        </button>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Tu lista</h2>
          {items.length > 0 && (
            <button onClick={handleClear} className="text-sm text-red-600">
              Vaciar lista
            </button>
          )}
        </div>

        {isLoading && <p>Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!isLoading && !error && items.length === 0 && (
          <p className="text-gray-500">Tu lista está vacía. Selecciona recetas arriba y genera una lista.</p>
        )}

        <ul className="space-y-1">
          {items.map((item) => (
            <ShoppingListItem key={item.id} item={item} onToggle={toggleChecked} />
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ShoppingListPage;
