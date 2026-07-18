function ShoppingListItem({ item, onToggle }) {
  return (
    <li className="flex items-center gap-3 py-3.5 border-b border-sand-100 last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(item.id, !item.checked)}
        aria-label={item.checked ? "Desmarcar ingrediente" : "Marcar ingrediente"}
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{
          borderColor: item.checked ? "#16a34a" : "#d8cdb8",
          background: item.checked ? "#16a34a" : "transparent",
        }}
      >
        {item.checked && (
          <svg width="13" height="13" viewBox="0 0 14 14">
            <path d="M2 7l3.5 3.5L12 3.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span className={`text-[16px] font-semibold ${item.checked ? "line-through text-sand-400" : "text-ink"}`}>
        {item.total_quantity} {item.unit} de {item.ingredient_name}
      </span>
    </li>
  );
}

export default ShoppingListItem;
