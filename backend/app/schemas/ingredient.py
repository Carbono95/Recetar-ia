from pydantic import BaseModel


class IngredientResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}
