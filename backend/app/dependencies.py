from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.exceptions import ForbiddenError, InvalidTokenError
from app.core.security import oauth2_scheme
from app.models.user import User
from app.services.auth_service import verify_token


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Resuelve el usuario autenticado a partir del access_token. Levanta InvalidTokenError si falla."""
    payload = verify_token(token, expected_type="access")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if user is None or not user.is_active:
        raise InvalidTokenError("Token inválido o expirado")

    return user


def require_role(*allowed_roles: str):
    """Dependency factory: restringe un endpoint a roles específicos."""

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError("No tienes permisos para realizar esta acción")
        return current_user

    return role_checker
