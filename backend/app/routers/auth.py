from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import (
    RefreshRequest,
    RefreshResponse,
    RegisterResponse,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services import auth_service

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Devuelve el perfil del usuario autenticado (usado por el frontend para saber ownership/role)."""
    return current_user


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)) -> RegisterResponse:
    """Registra un usuario nuevo y emite su primer par de tokens."""
    user = auth_service.register_user(user_data.username, user_data.password, db)
    tokens = auth_service.create_tokens(user.id)
    return RegisterResponse(user=UserResponse.model_validate(user), tokens=TokenResponse(**tokens))


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    """Valida credenciales y emite un nuevo par de tokens."""
    user = auth_service.login_user(credentials.username, credentials.password, db)
    tokens = auth_service.create_tokens(user.id)
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=RefreshResponse)
def refresh(body: RefreshRequest) -> RefreshResponse:
    """Emite un nuevo access_token a partir de un refresh_token válido."""
    access_token = auth_service.refresh_access_token(body.refresh_token)
    return RefreshResponse(access_token=access_token)
