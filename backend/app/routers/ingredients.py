from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.ingredient import Ingredient
from app.schemas.ingredient import IngredientResponse

router = APIRouter()


@router.get("", response_model=list[IngredientResponse])
def list_ingredients(
    q: str | None = Query(default=None, description="Filtro por nombre, para autocompletado"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Ingredient]:
    """Lista ingredientes existentes, usado para autocompletar al crear recetas."""
    query = db.query(Ingredient).order_by(Ingredient.name)
    if q:
        query = query.filter(Ingredient.name.contains(q.strip().lower()))
    return query.limit(50).all()
