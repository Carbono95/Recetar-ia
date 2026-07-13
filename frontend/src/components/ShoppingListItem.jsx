function ShoppingListItem({ item, onToggle }) {
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-sand-100 last:border-b-0">
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id, !item.checked)}
        className="w-5 h-5 shrink-0 accent-primary-500"
      />
      <span className={`text-sm font-semibold ${item.checked ? "line-through text-sand-400" : "text-ink"}`}>
        {item.total_quantity} {item.unit} de {item.ingredient_name}
      </span>
    </li>
  );
}

export default ShoppingListItem;
