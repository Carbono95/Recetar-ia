function ShoppingListItem({ item, onToggle }) {
  return (
    <li className="flex items-center gap-3 py-1">
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id, !item.checked)}
        className="w-5 h-5 shrink-0"
      />
      <span className={item.checked ? "line-through text-gray-400" : ""}>
        {item.total_quantity} {item.unit} de {item.ingredient_name}
      </span>
    </li>
  );
}

export default ShoppingListItem;
