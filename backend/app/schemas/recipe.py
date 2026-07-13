from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class RecipeIngredientInput(BaseModel):
    ingredient_name: str = Field(min_length=1, max_length=100)
    quantity: str = Field(min_length=1, max_length=50)
    unit: str = Field(min_length=1, max_length=30)


class RecipeIngredientResponse(BaseModel):
    ingredient_name: str
    quantity: str
    unit: str

    model_config = {"from_attributes": True}


class RecipeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    time_min: int = Field(gt=0)
    difficulty: Literal["facil", "media", "dificil"]
    category_id: int
    ingredients: list[RecipeIngredientInput] = Field(min_length=1)


class RecipeUpdate(RecipeCreate):
    """Mismo shape que RecipeCreate: PUT reemplaza la receta completa (datos + ingredientes)."""


class RecipeResponse(BaseModel):
    id: int
    title: str
    description: str | None
    time_min: int
    difficulty: str
    image_path: str | None
    category_id: int
    user_id: int
    created_at: datetime
    ingredients: list[RecipeIngredientResponse]
    is_favorite: bool = False

    model_config = {"from_attributes": True}


class RecipeListResponse(BaseModel):
    items: list[RecipeResponse]
    total: int
    page: int
    size: int
