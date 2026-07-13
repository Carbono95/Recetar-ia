function ShoppingListItem({ item, onToggle }) {
  return (
    <li className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id, !item.checked)}
      />
      <span className={item.checked ? "line-through text-gray-400" : ""}>
        {item.total_quantity} {item.unit} de {item.ingredient_name}
      </span>
    </li>
  );
}

export default ShoppingListItem;
