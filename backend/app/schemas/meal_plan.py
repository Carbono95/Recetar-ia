from datetime import date
from typing import Literal

from pydantic import BaseModel

MealType = Literal["comida", "cena"]


class MealPlanCreate(BaseModel):
    recipe_id: int
    date: date
    meal_type: MealType


class MealPlanResponse(BaseModel):
    id: int
    recipe_id: int
    recipe_title: str
    date: date
    meal_type: str

    model_config = {"from_attributes": True}


class MealPlanListResponse(BaseModel):
    items: list[MealPlanResponse]
