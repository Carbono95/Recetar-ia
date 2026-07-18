import { useEffect, useState } from "react";

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Cualquier dificultad" },
  { value: "facil", label: "Fácil" },
  { value: "media", label: "Media" },
  { value: "dificil", label: "Difícil" },
];

const SEARCH_DEBOUNCE_MS = 300;

function pillClass(active) {
  return `px-[15px] py-[7px] rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
    active ? "bg-primary-500 text-white" : "bg-white text-sand-600"
  }`;
}

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

  const activeCategory = filters.categoryId ? String(filters.categoryId) : "";

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Campo de búsqueda estilo iOS */}
      <div className="flex items-center gap-2.5 rounded-xl bg-black/[0.06] px-3.5 py-2.5">
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle cx="7" cy="7" r="5.5" stroke="#8a8072" strokeWidth="1.6" fill="none" />
          <path d="M11 11l3.5 3.5" stroke="#8a8072" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Buscar receta"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          className="flex-1 bg-transparent outline-none text-[16px] text-ink placeholder:text-sand-500"
        />
      </div>

      {/* Píldoras de categoría (scroll horizontal) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => onChange({ ...filters, categoryId: undefined })} className={pillClass(!activeCategory)}>
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange({ ...filters, categoryId: String(cat.id) })}
            className={pillClass(activeCategory === String(cat.id))}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filtros secundarios */}
      <div className="flex flex-wrap gap-2.5">
        <select
          value={filters.difficulty || ""}
          onChange={(event) => onChange({ ...filters, difficulty: event.target.value || undefined })}
          className="flex-1 min-w-[130px] px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-[13px] font-semibold text-sand-600"
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
          className="flex-1 min-w-[130px] px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-[13px] font-semibold text-sand-600"
        />

        <label className="flex-1 min-w-[130px] flex items-center gap-2 px-3 py-2.5 rounded-xl border border-sand-200 bg-white text-[13px] font-bold text-sand-600 cursor-pointer">
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
