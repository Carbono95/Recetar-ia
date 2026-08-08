from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.shopping import (
    ShoppingGenerateRequest,
    ShoppingItemCreate,
    ShoppingItemResponse,
    ShoppingItemUpdate,
    ShoppingListResponse,
)
from app.services import shopping_service

router = APIRouter()


@router.post("/generate", response_model=ShoppingListResponse)
def generate_shopping_list(
    body: ShoppingGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShoppingListResponse:
    """Genera la lista de compra combinando los ingredientes de las recetas seleccionadas."""
    items = shopping_service.generate_shopping_list(body.recipe_ids, current_user.id, db)
    return ShoppingListResponse(items=items)


@router.get("", response_model=ShoppingListResponse)
def get_shopping_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShoppingListResponse:
    items = shopping_service.get_shopping_list(current_user.id, db)
    return ShoppingListResponse(items=items)


@router.post("/items", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
def add_shopping_item(
    body: ShoppingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShoppingItemResponse:
    """Añade un artículo a mano a la lista (no procede de una receta)."""
    return shopping_service.add_manual_item(
        current_user.id, body.ingredient_name, body.total_quantity, body.unit, db
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_shopping_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    shopping_service.clear_shopping_list(current_user.id, db)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    shopping_service.delete_item(item_id, current_user.id, db)


@router.patch("/{item_id}/check", response_model=ShoppingItemResponse)
def check_shopping_item(
    item_id: int,
    body: ShoppingItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShoppingItemResponse:
    return shopping_service.set_item_checked(item_id, body.checked, current_user.id, db)
