from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

IS_SQLITE = settings.database_url.startswith("sqlite")


def normalize_database_url(url: str) -> str:
    """SQLAlchemy resuelve "postgres://"/"postgresql://" al driver psycopg2 por
    defecto, pero el proyecto instala psycopg (v3). Sin este rewrite, una
    DATABASE_URL de Render (que llega como "postgres://...") rompe la conexión
    en producción con ImportError, ya que psycopg2 no está instalado."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


# SQLite necesita este flag porque por defecto solo permite un thread por conexión
connect_args = {"check_same_thread": False} if IS_SQLITE else {}

engine = create_engine(normalize_database_url(settings.database_url), connect_args=connect_args)

if IS_SQLITE:
    # SQLite ignora "ON DELETE CASCADE" salvo que se active esta pragma por conexión;
    # sin ella, las FK sin relación ORM explícita (p. ej. Favorite, MealPlan) dejan
    # filas huérfanas en dev aunque en PostgreSQL (producción) sí cascadearían.
    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
