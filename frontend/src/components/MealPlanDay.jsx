const MEAL_TYPES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "comida", label: "Comida" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
];

function MealPlanDay({ date, dayLabel, entriesForDay, recipes, onAdd, onRemove }) {
  return (
    <div className="border rounded-lg p-3">
      <h3 className="font-semibold mb-2 capitalize">{dayLabel}</h3>
      <div className="space-y-3">
        {MEAL_TYPES.map((mealType) => {
          const entry = entriesForDay.find((item) => item.meal_type === mealType.value);
          return (
            <div key={mealType.value}>
              <p className="text-xs font-medium text-gray-500 uppercase">{mealType.label}</p>
              {entry ? (
                <div className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                  <span className="truncate">{entry.recipe_title}</span>
                  <button onClick={() => onRemove(entry.id)} className="text-red-600 text-xs shrink-0 ml-2">
                    Quitar
                  </button>
                </div>
              ) : (
                <select
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value) {
                      onAdd(Number(event.target.value), date, mealType.value);
                      event.target.value = "";
                    }
                  }}
                  className="w-full text-sm border rounded px-2 py-1"
                >
                  <option value="" disabled>
                    + Añadir receta
                  </option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MealPlanDay;
