from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ShoppingItem(Base):
    __tablename__ = "shopping_list"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ingredient_name: Mapped[str] = mapped_column(String(100), nullable=False)
    total_quantity: Mapped[str] = mapped_column(String(50), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(30), nullable=True)
    checked: Mapped[bool] = mapped_column(Boolean, default=False)
    # Origen del ítem: "recipe" (generado desde recetas) o "manual" (añadido a mano).
    # Al regenerar desde recetas solo se reemplazan los "recipe"; los manuales se conservan.
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="recipe")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
