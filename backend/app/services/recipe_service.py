import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Query, Session

from app.core.config import settings
from app.core.exceptions import ForbiddenError, RecipeNotFoundError, ValidationError
from app.models.category import Category
from app.models.favorite import Favorite
from app.models.ingredient import Ingredient
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeIngredientInput, RecipeUpdate

ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


def create_recipe(recipe_data: RecipeCreate, user_id: int, db: Session) -> Recipe:
    """Crea una receta con sus ingredientes para el usuario autenticado."""
    ensure_category_exists(recipe_data.category_id, db)

    recipe = Recipe(
        title=recipe_data.title,
        description=recipe_data.description,
        time_min=recipe_data.time_min,
        difficulty=recipe_data.difficulty,
        category_id=recipe_data.category_id,
        user_id=user_id,
        ingredients=build_recipe_ingredients(recipe_data.ingredients, db),
    )

    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


def ensure_category_exists(category_id: int, db: Session) -> None:
    if db.get(Category, category_id) is None:
        raise ValidationError(f"La categoría {category_id} no existe")


def build_recipe_ingredients(items: list[RecipeIngredientInput], db: Session) -> list[RecipeIngredient]:
    """Resuelve (o crea) cada ingrediente normalizado y arma las filas de la relación."""
    return [
        RecipeIngredient(
            ingredient=get_or_create_ingredient(item.ingredient_name, db),
            quantity=item.quantity,
            unit=item.unit,
        )
        for item in items
    ]


def get_or_create_ingredient(name: str, db: Session) -> Ingredient:
    normalized_name = name.strip().lower()
    ingredient = db.query(Ingredient).filter(Ingredient.name == normalized_name).first()
    if ingredient is None:
        ingredient = Ingredient(name=normalized_name)
        db.add(ingredient)
        db.flush()  # necesitamos el id antes del commit para enlazar la relación
    return ingredient


def search_recipes(
    db: Session,
    page: int,
    size: int,
    q: str | None = None,
    category_id: int | None = None,
    difficulty: str | None = None,
    time_max: int | None = None,
    favorite_recipe_ids: set[int] | None = None,
) -> tuple[list[Recipe], int]:
    """Busca en el recetario compartido (todas las recetas), aplicando los filtros dados."""
    query = db.query(Recipe).order_by(Recipe.created_at.desc())
    query = apply_recipe_filters(query, q, category_id, difficulty, time_max, favorite_recipe_ids)
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return items, total


def apply_recipe_filters(
    query: Query,
    q: str | None,
    category_id: int | None,
    difficulty: str | None,
    time_max: int | None,
    favorite_recipe_ids: set[int] | None,
) -> Query:
    if q:
        query = query.filter(Recipe.title.ilike(f"%{q}%"))
    if category_id is not None:
        query = query.filter(Recipe.category_id == category_id)
    if difficulty is not None:
        query = query.filter(Recipe.difficulty == difficulty)
    if time_max is not None:
        query = query.filter(Recipe.time_min <= time_max)
    if favorite_recipe_ids is not None:
        query = query.filter(Recipe.id.in_(favorite_recipe_ids))
    return query


def get_recipe_or_404(recipe_id: int, db: Session) -> Recipe:
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        raise RecipeNotFoundError(f"Receta {recipe_id} no encontrada")
    return recipe


def get_owned_recipe(recipe_id: int, current_user: User, db: Session) -> Recipe:
    """Devuelve la receta si el usuario es su dueño o admin; si no, levanta ForbiddenError."""
    recipe = get_recipe_or_404(recipe_id, db)
    ensure_user_can_modify_recipe(recipe, current_user)
    return recipe


def ensure_user_can_modify_recipe(recipe: Recipe, current_user: User) -> None:
    is_owner = recipe.user_id == current_user.id
    if not is_owner and current_user.role != "admin":
        raise ForbiddenError("No tienes permisos para modificar esta receta")


def update_recipe(recipe_id: int, recipe_data: RecipeUpdate, current_user: User, db: Session) -> Recipe:
    """Reemplaza los datos e ingredientes de una receta propia (o de admin)."""
    recipe = get_owned_recipe(recipe_id, current_user, db)
    ensure_category_exists(recipe_data.category_id, db)

    recipe.title = recipe_data.title
    recipe.description = recipe_data.description
    recipe.time_min = recipe_data.time_min
    recipe.difficulty = recipe_data.difficulty
    recipe.category_id = recipe_data.category_id
    recipe.ingredients = build_recipe_ingredients(recipe_data.ingredients, db)

    db.commit()
    db.refresh(recipe)
    return recipe


def delete_recipe(recipe_id: int, current_user: User, db: Session) -> None:
    recipe = get_owned_recipe(recipe_id, current_user, db)
    db.delete(recipe)
    db.commit()


def set_recipe_image(recipe_id: int, image_path: str, current_user: User, db: Session) -> Recipe:
    recipe = get_owned_recipe(recipe_id, current_user, db)
    recipe.image_path = image_path
    db.commit()
    db.refresh(recipe)
    return recipe


def get_favorited_recipe_ids(user_id: int, db: Session) -> set[int]:
    rows = db.query(Favorite.recipe_id).filter(Favorite.user_id == user_id).all()
    return {row[0] for row in rows}


def attach_favorite_flags(recipes: list[Recipe], user_id: int, db: Session) -> list[Recipe]:
    """Marca cada receta con is_favorite según los favoritos del usuario (una sola consulta)."""
    favorited_ids = get_favorited_recipe_ids(user_id, db)
    for recipe in recipes:
        recipe.is_favorite = recipe.id in favorited_ids
    return recipes


def attach_favorite_flag(recipe: Recipe, user_id: int, db: Session) -> Recipe:
    recipe.is_favorite = recipe.id in get_favorited_recipe_ids(user_id, db)
    return recipe


def add_favorite(recipe_id: int, user_id: int, db: Session) -> Recipe:
    """Marca una receta como favorita (idempotente: si ya lo era, no hace nada)."""
    recipe = get_recipe_or_404(recipe_id, db)
    already_favorited = recipe_id in get_favorited_recipe_ids(user_id, db)
    if not already_favorited:
        db.add(Favorite(user_id=user_id, recipe_id=recipe_id))
        db.commit()
    recipe.is_favorite = True
    return recipe


def remove_favorite(recipe_id: int, user_id: int, db: Session) -> None:
    """Quita una receta de favoritos (idempotente: si no lo era, no hace nada)."""
    db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.recipe_id == recipe_id).delete()
    db.commit()


def save_recipe_image(file: UploadFile, contents: bytes) -> str:
    """Guarda la imagen subida en MEDIA_DIR y devuelve su ruta pública."""
    extension = ALLOWED_IMAGE_TYPES.get(file.content_type)
    if extension is None:
        raise ValidationError("Formato de imagen no soportado (usa JPEG, PNG o WEBP)")
    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError("La imagen no puede superar 5MB")

    media_dir = Path(settings.media_dir)
    media_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    (media_dir / filename).write_bytes(contents)

    return f"/media/{filename}"
