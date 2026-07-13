import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.dependencies import get_db
from app.main import app
from app.models import Category  # noqa: F401 - importar app.models registra todos los modelos en Base.metadata

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    # Mismo motivo que en app.core.database: sin esto, ON DELETE CASCADE es inerte en SQLite
    # y los tests no detectarían filas huérfanas que sí se limpiarían en PostgreSQL.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def category(db_session):
    """Categoría lista para usar como category_id en tests de recetas."""
    cat = Category(name="Plato principal", slug="plato-principal")
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)
    return cat


@pytest.fixture()
def auth_headers(client):
    """Registra un usuario y devuelve el header Authorization con su access_token."""

    def _auth_headers(username: str = "chef", password: str = "supersecret"):
        response = client.post("/api/v1/auth/register", json={"username": username, "password": password})
        access_token = response.json()["tokens"]["access_token"]
        return {"Authorization": f"Bearer {access_token}"}

    return _auth_headers
