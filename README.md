# RecetarIA

Aplicación web de gestión de recetas con lista de compra automática. Permite crear, guardar y organizar recetas, y genera automáticamente listas de compra al combinar varias recetas seleccionadas.

**MVP (v1):** gestión de recetas + lista de compra automática + planner semanal + búsqueda + favoritos.
**v2 (posterior):** integración con OpenAI para sugerencias.

## Stack

- **Backend:** Python 3.12 · FastAPI 0.115 · SQLAlchemy 2.0 · Pydantic 2.13 · Alembic 1.14 · JWT + Argon2
- **Frontend:** React 18.3 · React Router 6 · Vite 6.3 · TailwindCSS · Radix UI · Framer Motion
- **BD:** SQLite (desarrollo) · PostgreSQL 15 (producción)
- **Deploy:** Vercel (frontend) · Render (backend + PostgreSQL)

## Setup

```bash
git clone <repo-url>
cd RecetarIA

# Base de datos (PostgreSQL vía Docker, opcional en dev si usas SQLite)
docker-compose up -d

# Backend
cd backend
pip install -r requirements.txt
cp ../.env.example .env   # ajusta SECRET_KEY y demás valores
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173` (frontend) y `http://localhost:8000/docs` (API, Swagger).

## Documentación

- [`CLAUDE.md`](./CLAUDE.md) — contexto completo del proyecto: scope, esquema de BD, flujos, convenciones y roadmap.
- `SKILL.md` — convenciones de stack y desarrollo (ver carpeta raíz / `.claude`).
