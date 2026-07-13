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
    <div className="max-w-narrow mx-auto p-6">
      <h1 className="font-heading font-extrabold text-2xl text-ink mb-5">Lista de compra</h1>

      <section className="bg-white rounded-[18px] shadow-cardSm p-5 mb-5">
        <h2 className="font-heading font-bold text-lg text-ink mb-3">Selecciona recetas</h2>
        {isLoadingRecipes && <p className="text-sand-500">Cargando recetas...</p>}
        {!isLoadingRecipes && recipes.length === 0 && (
          <p className="text-sand-400 font-semibold">Aún no tienes recetas creadas.</p>
        )}
        <div className="flex flex-col mb-3">
          {recipes.map((recipe) => (
            <label key={recipe.id} className="flex items-center gap-3 py-1.5">
              <input
                type="checkbox"
                checked={selectedRecipeIds.includes(recipe.id)}
                onChange={() => toggleRecipeSelection(recipe.id)}
                className="w-5 h-5 shrink-0 accent-primary-500"
              />
              <span className="text-sm font-semibold text-ink">{recipe.title}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleGenerate}
          disabled={selectedRecipeIds.length === 0 || isLoading}
          className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm disabled:opacity-50"
        >
          Generar lista
        </button>
      </section>

      <section className="bg-white rounded-[18px] shadow-cardSm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-lg text-ink">Tu lista</h2>
          {items.length > 0 && (
            <button onClick={handleClear} className="font-bold text-sm text-red-600">
              Vaciar lista
            </button>
          )}
        </div>

        {isLoading && <p className="text-sand-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!isLoading && !error && items.length === 0 && (
          <p className="text-sand-400 font-semibold">Tu lista está vacía. Selecciona recetas arriba y genera una lista.</p>
        )}

        <ul className="flex flex-col">
          {items.map((item) => (
            <ShoppingListItem key={item.id} item={item} onToggle={toggleChecked} />
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ShoppingListPage;
