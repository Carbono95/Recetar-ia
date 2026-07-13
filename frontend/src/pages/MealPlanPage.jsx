import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MealPlanDay from "../components/MealPlanDay.jsx";
import { useMealPlan } from "../hooks/useMealPlan.js";
import recipeService from "../services/recipeService";

const DAY_COUNT = 7;

function MealPlanPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const {
    weekStart,
    weekLabel,
    entries,
    isLoading,
    error,
    addEntry,
    removeEntry,
    generateShoppingList,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  } = useMealPlan();

  useEffect(() => {
    recipeService.list({ page: 1, size: 100 }).then((data) => setRecipes(data.items));
  }, []);

  const handleAdd = async (recipeId, date, mealType) => {
    try {
      await addEntry(recipeId, date, mealType);
    } catch (err) {
      window.alert(err.message || "No se pudo añadir la receta");
    }
  };

  const handleRemove = async (entryId) => {
    try {
      await removeEntry(entryId);
    } catch (err) {
      window.alert(err.message || "No se pudo quitar la receta");
    }
  };

  const handleGenerate = async () => {
    try {
      await generateShoppingList();
      navigate("/shopping");
    } catch (err) {
      window.alert(err.message || "No se pudo generar la lista semanal");
    }
  };

  const days = Array.from({ length: DAY_COUNT }, (_, index) => addDays(weekStart, index));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Planner semanal</h1>
        <div className="flex items-center gap-2">
          <button onClick={goToPreviousWeek} className="px-3 py-1 border rounded">
            ← Anterior
          </button>
          <button onClick={goToCurrentWeek} className="px-3 py-1 border rounded">
            Hoy
          </button>
          <button onClick={goToNextWeek} className="px-3 py-1 border rounded">
            Siguiente →
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-4">
        Semana {weekLabel} · {format(weekStart, "d MMM", { locale: es })} –{" "}
        {format(addDays(weekStart, 6), "d MMM", { locale: es })}
      </p>

      {isLoading && <p>Cargando planner...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {days.map((date) => {
          const dateKey = format(date, "yyyy-MM-dd");
          const entriesForDay = entries.filter((entry) => entry.date === dateKey);
          return (
            <MealPlanDay
              key={dateKey}
              date={dateKey}
              dayLabel={format(date, "EEEE d", { locale: es })}
              entriesForDay={entriesForDay}
              recipes={recipes}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          );
        })}
      </div>

      <button
        onClick={handleGenerate}
        disabled={entries.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Generar lista de compra semanal
      </button>
    </div>
  );
}

export default MealPlanPage;
