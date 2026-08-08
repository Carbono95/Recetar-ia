from pydantic import BaseModel, Field


class ShoppingGenerateRequest(BaseModel):
    recipe_ids: list[int] = Field(min_length=1)


class ShoppingItemResponse(BaseModel):
    id: int
    ingredient_name: str
    total_quantity: str
    unit: str | None
    checked: bool
    source: str

    model_config = {"from_attributes": True}


class ShoppingItemCreate(BaseModel):
    """Artículo añadido a mano a la lista (no procede de una receta)."""

    ingredient_name: str = Field(min_length=1, max_length=100)
    total_quantity: str = Field(default="", max_length=50)
    unit: str | None = Field(default=None, max_length=30)


class ShoppingItemUpdate(BaseModel):
    checked: bool


class ShoppingListResponse(BaseModel):
    items: list[ShoppingItemResponse]
