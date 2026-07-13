const MEAL_TYPES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "comida", label: "Comida" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
];

function MealPlanDay({ date, dayLabel, entriesForDay, recipes, onAdd, onRemove }) {
  return (
    <div className="bg-white rounded-[14px] shadow-cardSm p-3.5">
      <h3 className="font-heading font-bold text-sm text-ink mb-2 capitalize">{dayLabel}</h3>
      <div className="flex flex-col gap-3">
        {MEAL_TYPES.map((mealType) => {
          const entry = entriesForDay.find((item) => item.meal_type === mealType.value);
          return (
            <div key={mealType.value}>
              <p className="text-[11px] font-bold text-sand-400 uppercase tracking-wide mb-1">{mealType.label}</p>
              {entry ? (
                <div className="flex items-center justify-between text-sm bg-cream rounded-lg px-2.5 py-1.5">
                  <span className="truncate text-ink font-semibold">{entry.recipe_title}</span>
                  <button onClick={() => onRemove(entry.id)} className="font-bold text-red-600 text-xs shrink-0 ml-2">
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
                  className="w-full text-sm border border-sand-200 rounded-lg px-2.5 py-1.5 text-sand-600"
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
