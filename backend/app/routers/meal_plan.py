from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.meal_plan import MealPlanCreate, MealPlanListResponse, MealPlanResponse
from app.schemas.shopping import ShoppingListResponse
from app.services import meal_plan_service

router = APIRouter()


@router.post("", response_model=MealPlanResponse, status_code=status.HTTP_201_CREATED)
def add_meal_plan_entry(
    body: MealPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MealPlanResponse:
    """Asigna una receta del recetario compartido a un día y tipo de comida."""
    return meal_plan_service.add_meal_plan_entry(
        current_user.id, body.recipe_id, body.date, body.meal_type, db
    )


@router.get("", response_model=MealPlanListResponse)
def get_meal_plan(
    week: str = Query(description="Semana ISO, formato YYYY-Www (p. ej. 2026-W28)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MealPlanListResponse:
    items = meal_plan_service.get_week_entries(current_user.id, week, db)
    return MealPlanListResponse(items=items)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_meal_plan_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    meal_plan_service.remove_meal_plan_entry(entry_id, current_user.id, db)


@router.post("/generate-shopping", response_model=ShoppingListResponse)
def generate_weekly_shopping_list(
    week: str = Query(description="Semana ISO, formato YYYY-Www"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShoppingListResponse:
    """Genera la lista de compra combinando todas las recetas planificadas esa semana."""
    items = meal_plan_service.generate_weekly_shopping_list(current_user.id, week, db)
    return ShoppingListResponse(items=items)
