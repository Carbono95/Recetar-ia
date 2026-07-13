class AppError(Exception):
    """Excepción base para errores de negocio de la aplicación."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    """Recurso solicitado no existe (mapea a HTTP 404)."""


class ValidationError(AppError):
    """Datos de entrada inválidos según reglas de negocio (mapea a HTTP 422)."""


class UnauthorizedError(AppError):
    """Credenciales ausentes o inválidas (mapea a HTTP 401)."""


class ForbiddenError(AppError):
    """Usuario autenticado sin permiso para la acción (mapea a HTTP 403)."""


class RecipeNotFoundError(NotFoundError):
    pass


class ShoppingItemNotFoundError(NotFoundError):
    pass


class MealPlanEntryNotFoundError(NotFoundError):
    pass


class DuplicateUsernameError(ValidationError):
    """Ya existe una cuenta registrada con ese username (mapea a HTTP 422)."""


class InvalidCredentialsError(UnauthorizedError):
    """Username o contraseña incorrectos (mapea a HTTP 401)."""


class InvalidTokenError(UnauthorizedError):
    """JWT ausente, malformado, expirado o de tipo incorrecto (mapea a HTTP 401)."""
