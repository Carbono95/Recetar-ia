from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse

router = APIRouter()


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Category]:
    """Lista las categorías disponibles (sembradas por la migración inicial)."""
    return db.query(Category).order_by(Category.name).all()
