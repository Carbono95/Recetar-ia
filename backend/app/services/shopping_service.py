from sqlalchemy.orm import Session

from app.core.exceptions import RecipeNotFoundError, ShoppingItemNotFoundError
from app.models.recipe import Recipe
from app.models.shopping_item import ShoppingItem


def generate_shopping_list(recipe_ids: list[int], user_id: int, db: Session) -> list[ShoppingItem]:
    """Genera la lista de compra combinando los ingredientes de las recetas seleccionadas.

    Las recetas pueden ser de cualquier usuario (recetario compartido).
    Reemplaza cualquier lista anterior del usuario (regeneración desde cero).
    """
    recipes = get_recipes_by_ids(recipe_ids, db)
    items_data = build_shopping_items(recipes)
    return replace_shopping_list(user_id, items_data, db)


def get_recipes_by_ids(recipe_ids: list[int], db: Session) -> list[Recipe]:
    """Obtiene las recetas solicitadas del recetario compartido, validando que todas existan."""
    recipes = db.query(Recipe).filter(Recipe.id.in_(recipe_ids)).all()
    found_ids = {recipe.id for recipe in recipes}
    missing_ids = set(recipe_ids) - found_ids
    if missing_ids:
        raise RecipeNotFoundError(f"Recetas no encontradas: {sorted(missing_ids)}")
    return recipes


def build_shopping_items(recipes: list[Recipe]) -> list[dict]:
    """Agrupa y suma los ingredientes de varias recetas por (nombre, unidad)."""
    merged: dict[tuple[str, str | None], str] = {}
    for recipe in recipes:
        for recipe_ingredient in recipe.ingredients:
            key = (recipe_ingredient.ingredient_name, recipe_ingredient.unit)
            merged[key] = sum_quantities(merged.get(key), recipe_ingredient.quantity)
    return [
        {"ingredient_name": name, "unit": unit, "total_quantity": quantity}
        for (name, unit), quantity in merged.items()
    ]


def sum_quantities(existing: str | None, new: str) -> str:
    """Suma numérica si ambas cantidades son números; si no, las concatena."""
    if existing is None:
        return new
    try:
        return format_quantity(float(existing) + float(new))
    except ValueError:
        return f"{existing} + {new}"


def format_quantity(value: float) -> str:
    """Evita mostrar '6.0' cuando el resultado es un entero exacto."""
    return str(int(value)) if value.is_integer() else str(value)


def replace_shopping_list(user_id: int, items_data: list[dict], db: Session) -> list[ShoppingItem]:
    """Reemplaza los ítems generados desde recetas, conservando los manuales."""
    clear_recipe_items(user_id, db)
    items = [ShoppingItem(user_id=user_id, source="recipe", **data) for data in items_data]
    db.add_all(items)
    db.commit()
    for item in items:
        db.refresh(item)
    # Devolvemos la lista completa (manuales + recién generados) ya ordenada.
    return get_shopping_list(user_id, db)


def clear_recipe_items(user_id: int, db: Session) -> None:
    """Borra solo los ítems procedentes de recetas (deja los manuales)."""
    db.query(ShoppingItem).filter(
        ShoppingItem.user_id == user_id, ShoppingItem.source == "recipe"
    ).delete()
    db.commit()


def clear_shopping_list(user_id: int, db: Session) -> None:
    """Vacía la lista entera (manuales incluidos)."""
    db.query(ShoppingItem).filter(ShoppingItem.user_id == user_id).delete()
    db.commit()


def add_manual_item(
    user_id: int, ingredient_name: str, total_quantity: str, unit: str | None, db: Session
) -> ShoppingItem:
    """Añade un artículo a mano a la lista (source='manual')."""
    item = ShoppingItem(
        user_id=user_id,
        ingredient_name=ingredient_name.strip(),
        total_quantity=total_quantity.strip(),
        unit=unit.strip() if unit else None,
        source="manual",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_item(item_id: int, user_id: int, db: Session) -> None:
    """Borra un ítem individual de la lista (cualquier origen)."""
    item = get_owned_item_or_404(item_id, user_id, db)
    db.delete(item)
    db.commit()


def get_shopping_list(user_id: int, db: Session) -> list[ShoppingItem]:
    return (
        db.query(ShoppingItem)
        .filter(ShoppingItem.user_id == user_id)
        .order_by(ShoppingItem.ingredient_name)
        .all()
    )


def get_owned_item_or_404(item_id: int, user_id: int, db: Session) -> ShoppingItem:
    item = (
        db.query(ShoppingItem)
        .filter(ShoppingItem.id == item_id, ShoppingItem.user_id == user_id)
        .first()
    )
    if item is None:
        raise ShoppingItemNotFoundError(f"Item {item_id} no encontrado")
    return item


def set_item_checked(item_id: int, checked: bool, user_id: int, db: Session) -> ShoppingItem:
    item = get_owned_item_or_404(item_id, user_id, db)
    item.checked = checked
    db.commit()
    db.refresh(item)
    return item
