from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateUsernameError, InvalidCredentialsError, InvalidTokenError, ValidationError
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.models.user import User

MIN_PASSWORD_LENGTH = 8
REFRESH_TOKEN_EXPIRE_DAYS = 7


def register_user(username: str, password: str, db: Session) -> User:
    """Crea un usuario nuevo con la contraseña hasheada con Argon2."""
    validate_password_strength(password)
    ensure_username_is_available(username, db)

    user = User(username=username, password=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def validate_password_strength(password: str) -> None:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValidationError(f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres")


def ensure_username_is_available(username: str, db: Session) -> None:
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise DuplicateUsernameError("Ya existe una cuenta con ese nombre de usuario")


def login_user(username: str, password: str, db: Session) -> User:
    """Valida credenciales y devuelve el usuario autenticado."""
    user = db.query(User).filter(User.username == username).first()
    if user is None or not verify_password(password, user.password):
        raise InvalidCredentialsError("Usuario o contraseña incorrectos")
    return user


def create_tokens(user_id: int) -> dict:
    """Emite un access_token (30 min) y un refresh_token (7 días)."""
    access_token = create_access_token(data={"sub": str(user_id), "type": "access"})
    refresh_token = create_access_token(
        data={"sub": str(user_id), "type": "refresh"},
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return {"access_token": access_token, "refresh_token": refresh_token}


def verify_token(token: str, expected_type: str | None = None) -> dict:
    """Decodifica un JWT y valida expiración y tipo. Levanta InvalidTokenError si falla."""
    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise InvalidTokenError("Token inválido o expirado")
    if expected_type is not None and payload.get("type") != expected_type:
        raise InvalidTokenError("Token inválido o expirado")
    return payload


def refresh_access_token(refresh_token: str) -> str:
    """Genera un nuevo access_token a partir de un refresh_token válido."""
    payload = verify_token(refresh_token, expected_type="refresh")
    return create_access_token(data={"sub": payload["sub"], "type": "access"})
