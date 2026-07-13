import { useEffect, useState } from "react";

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Cualquier dificultad" },
  { value: "facil", label: "Fácil" },
  { value: "media", label: "Media" },
  { value: "dificil", label: "Difícil" },
];

const SEARCH_DEBOUNCE_MS = 300;

function SearchBar({ filters, categories, onChange }) {
  const [queryInput, setQueryInput] = useState(filters.q || "");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (queryInput !== (filters.q || "")) {
        onChange({ ...filters, q: queryInput || undefined });
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-cardSm flex flex-col gap-3 mb-6">
      <input
        type="text"
        placeholder="Buscar receta..."
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
        className="w-full px-3.5 py-3 rounded-xl border border-sand-200 text-sm outline-none focus:border-primary-500"
      />

      <div className="flex flex-wrap gap-2.5">
        <select
          value={filters.categoryId || ""}
          onChange={(event) => onChange({ ...filters, categoryId: event.target.value || undefined })}
          className="flex-1 min-w-[120px] px-3 py-2.5 rounded-xl border border-sand-200 text-[13px] font-semibold text-sand-600"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={filters.difficulty || ""}
          onChange={(event) => onChange({ ...filters, difficulty: event.target.value || undefined })}
          className="flex-1 min-w-[120px] px-3 py-2.5 rounded-xl border border-sand-200 text-[13px] font-semibold text-sand-600"
        >
          {DIFFICULTY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Tiempo máx. (min)"
          min="1"
          value={filters.timeMax || ""}
          onChange={(event) => onChange({ ...filters, timeMax: event.target.value || undefined })}
          className="flex-1 min-w-[120px] px-3 py-2.5 rounded-xl border border-sand-200 text-[13px] font-semibold text-sand-600"
        />

        <label className="flex-1 min-w-[120px] flex items-center gap-2 px-3 py-2.5 rounded-xl border border-sand-200 text-[13px] font-bold text-sand-600 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(filters.favoritesOnly)}
            onChange={(event) => onChange({ ...filters, favoritesOnly: event.target.checked || undefined })}
            className="w-4 h-4 accent-primary-500"
          />
          Solo favoritos
        </label>
      </div>
    </div>
  );
}

export default SearchBar;
