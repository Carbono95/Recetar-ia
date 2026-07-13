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
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Buscar por título..."
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
        className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] px-3 py-2 border rounded"
      />

      <select
        value={filters.categoryId || ""}
        onChange={(event) => onChange({ ...filters, categoryId: event.target.value || undefined })}
        className="w-full sm:w-auto px-3 py-2 border rounded"
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
        className="w-full sm:w-auto px-3 py-2 border rounded"
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
        className="w-full sm:w-40 px-3 py-2 border rounded"
      />

      <label className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 border rounded cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(filters.favoritesOnly)}
          onChange={(event) => onChange({ ...filters, favoritesOnly: event.target.checked || undefined })}
        />
        Solo favoritos
      </label>
    </div>
  );
}

export default SearchBar;
