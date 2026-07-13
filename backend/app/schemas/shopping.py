from pydantic import BaseModel, Field


class ShoppingGenerateRequest(BaseModel):
    recipe_ids: list[int] = Field(min_length=1)


class ShoppingItemResponse(BaseModel):
    id: int
    ingredient_name: str
    total_quantity: str
    unit: str | None
    checked: bool

    model_config = {"from_attributes": True}


class ShoppingItemUpdate(BaseModel):
    checked: bool


class ShoppingListResponse(BaseModel):
    items: list[ShoppingItemResponse]
