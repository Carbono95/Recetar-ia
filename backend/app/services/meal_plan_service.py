from datetime import date as date_type, timedelta

from sqlalchemy.orm import Session

from app.core.exceptions import MealPlanEntryNotFoundError, ValidationError
from app.models.meal_plan import MealPlan
from app.models.shopping_item import ShoppingItem
from app.services import shopping_service
from app.services.recipe_service import get_recipe_or_404


def add_meal_plan_entry(
    user_id: int, recipe_id: int, entry_date: date_type, meal_type: str, db: Session
) -> MealPlan:
    """Asigna una receta del recetario compartido a un día y tipo de comida."""
    get_recipe_or_404(recipe_id, db)
    entry = MealPlan(user_id=user_id, recipe_id=recipe_id, date=entry_date, meal_type=meal_type)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_week_range(week: str) -> tuple[date_type, date_type]:
    """Convierte una semana ISO 'YYYY-Www' en (lunes, domingo) de esa semana."""
    try:
        year_str, week_str = week.split("-W")
        monday = date_type.fromisocalendar(int(year_str), int(week_str), 1)
    except (ValueError, IndexError) as exc:
        raise ValidationError(f"Formato de semana inválido: '{week}' (usa YYYY-Www, p. ej. 2026-W28)") from exc
    return monday, monday + timedelta(days=6)


def get_week_entries(user_id: int, week: str, db: Session) -> list[MealPlan]:
    monday, sunday = get_week_range(week)
    return (
        db.query(MealPlan)
        .filter(MealPlan.user_id == user_id, MealPlan.date >= monday, MealPlan.date <= sunday)
        .order_by(MealPlan.date, MealPlan.meal_type)
        .all()
    )


def get_owned_entry_or_404(entry_id: int, user_id: int, db: Session) -> MealPlan:
    entry = db.query(MealPlan).filter(MealPlan.id == entry_id, MealPlan.user_id == user_id).first()
    if entry is None:
        raise MealPlanEntryNotFoundError(f"Entrada {entry_id} no encontrada")
    return entry


def remove_meal_plan_entry(entry_id: int, user_id: int, db: Session) -> None:
    entry = get_owned_entry_or_404(entry_id, user_id, db)
    db.delete(entry)
    db.commit()


def generate_weekly_shopping_list(user_id: int, week: str, db: Session) -> list[ShoppingItem]:
    """Genera la lista de compra de la semana combinando todas las recetas planificadas.

    Si una receta se planifica varias veces en la semana, sus ingredientes se
    cuentan una vez por cada aparición (no se deduplica por receta, solo por
    ingrediente+unidad, igual que en la generación manual).
    """
    entries = get_week_entries(user_id, week, db)
    if not entries:
        raise ValidationError("No hay recetas planificadas para esa semana")

    unique_recipe_ids = {entry.recipe_id for entry in entries}
    recipes_by_id = {recipe.id: recipe for recipe in shopping_service.get_recipes_by_ids(list(unique_recipe_ids), db)}
    recipes_with_repeats = [recipes_by_id[entry.recipe_id] for entry in entries]

    items_data = shopping_service.build_shopping_items(recipes_with_repeats)
    return shopping_service.replace_shopping_list(user_id, items_data, db)
