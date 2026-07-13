from typing import Literal

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeListResponse, RecipeResponse, RecipeUpdate
from app.services import recipe_service

router = APIRouter()


@router.get("", response_model=RecipeListResponse)
def list_recipes(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    q: str | None = Query(default=None, description="Búsqueda por título"),
    category_id: int | None = Query(default=None),
    difficulty: Literal["facil", "media", "dificil"] | None = Query(default=None),
    time_max: int | None = Query(default=None, ge=1, description="Tiempo máximo en minutos"),
    favorites_only: bool = Query(default=False, description="Mostrar solo las recetas favoritas del usuario"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecipeListResponse:
    """Lista paginada del recetario compartido, con filtros combinables."""
    favorite_recipe_ids = (
        recipe_service.get_favorited_recipe_ids(current_user.id, db) if favorites_only else None
    )
    items, total = recipe_service.search_recipes(
        db, page, size, q=q, category_id=category_id, difficulty=difficulty, time_max=time_max,
        favorite_recipe_ids=favorite_recipe_ids,
    )
    recipe_service.attach_favorite_flags(items, current_user.id, db)
    return RecipeListResponse(items=items, total=total, page=page, size=size)


@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecipeResponse:
    """Cualquier usuario autenticado puede ver el detalle (recetario compartido)."""
    recipe = recipe_service.get_recipe_or_404(recipe_id, db)
    return recipe_service.attach_favorite_flag(recipe, current_user.id, db)


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe_data: RecipeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecipeResponse:
    recipe = recipe_service.create_recipe(recipe_data, current_user.id, db)
    return recipe_service.attach_favorite_flag(recipe, current_user.id, db)


@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(
    recipe_id: int,
    recipe_data: RecipeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecipeResponse:
    recipe = recipe_service.update_recipe(recipe_id, recipe_data, current_user, db)
    return recipe_service.attach_favorite_flag(recipe, current_user.id, db)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    recipe_service.delete_recipe(recipe_id, current_user, db)


@router.post("/{recipe_id}/image", response_model=RecipeResponse)
async def upload_recipe_image(
    recipe_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecipeResponse:
    """Sube (o reemplaza) la imagen de una receta propia."""
    contents = await file.read()
    image_path = recipe_service.save_recipe_image(file, contents)
    recipe = recipe_service.set_recipe_image(recipe_id, image_path, current_user, db)
    return recipe_service.attach_favorite_flag(recipe, current_user.id, db)


@router.post("/{recipe_id}/favorite", response_model=RecipeResponse)
def add_favorite(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecipeResponse:
    """Marca una receta del recetario compartido como favorita (idempotente)."""
    return recipe_service.add_favorite(recipe_id, current_user.id, db)


@router.delete("/{recipe_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    recipe_service.remove_favorite(recipe_id, current_user.id, db)
