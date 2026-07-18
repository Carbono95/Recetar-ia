from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.exceptions import AppError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError
from app.routers import auth, categories, ingredients, meal_plan, recipes, shopping

app = FastAPI(
    title="RecetarIA API",
    description="Gestión de recetas con lista de compra automática",
    version="0.1.0",
)

# En dev el frontend (Vite) y las pruebas desde navegador del móvil (Expo Web, IP de la LAN)
# llaman desde orígenes distintos. CORS solo lo aplican navegadores —la app nativa de React
# Native no lo exige—, pero el regex cubre el caso dev-web sin abrir nada en producción.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"] if settings.debug else settings.cors_origins_list,
    allow_origin_regex=r"http://192\.168\.\d+\.\d+(:\d+)?" if settings.debug else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(recipes.router, prefix="/api/v1/recipes", tags=["recipes"])
app.include_router(ingredients.router, prefix="/api/v1/ingredients", tags=["ingredients"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(shopping.router, prefix="/api/v1/shopping", tags=["shopping"])
app.include_router(meal_plan.router, prefix="/api/v1/meal-plan", tags=["meal-plan"])
# TODO Fase 6+: registrar routers aquí a medida que se implementen
# app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

Path(settings.media_dir).mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")

# Orden importa: se evalúa de más específico a más genérico para elegir el status code
_STATUS_BY_ERROR_TYPE = {
    NotFoundError: status.HTTP_404_NOT_FOUND,
    ValidationError: status.HTTP_422_UNPROCESSABLE_ENTITY,
    UnauthorizedError: status.HTTP_401_UNAUTHORIZED,
    ForbiddenError: status.HTTP_403_FORBIDDEN,
}


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Traduce excepciones de negocio a HTTP. Nuevas subclases de AppError
    funcionan automáticamente sin tocar este archivo."""
    for error_type, status_code in _STATUS_BY_ERROR_TYPE.items():
        if isinstance(exc, error_type):
            return JSONResponse(status_code=status_code, content={"detail": exc.message})
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": "Internal server error"}
    )


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "environment": settings.environment}
