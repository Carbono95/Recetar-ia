# RecetarIA — Contexto del proyecto

## 📋 Visión general

**RecetarIA** es una aplicación web de gestión de recetas con lista de compra automática. Permite a usuarios crear, guardar y organizar recetas, y genera automáticamente listas de compra cuando seleccionan varias recetas.

**MVP (v1):** Gestión de recetas + lista compra automática  
**v2 (posterior):** Integración IA con OpenAI (sugerencias, chat contextuado)

**Usuarios objetivo:** 2-3 personas + 1 admin  
**Propósito:** Portfolio profesional de DAW + herramienta real de uso diario

---

## 🎯 Scope del proyecto (MVP - v1)

### ✅ Incluido en MVP
- Autenticación de usuarios con roles (user, admin)
- CRUD completo de recetas (crear, leer, actualizar, eliminar)
- Sistema de ingredientes con deduplicación automática
- Generador automático de lista de compra (seleccionar recetas → ingredientes combinados)
- Buscador de recetas (por nombre, categoría, dificultad, tiempo)
- Sistema de favoritos (many-to-many)
- Planner semanal (organizar recetas por día/tipo: desayuno, comida, cena)
- Subida de imágenes de recetas
- Interfaz responsive (móvil, tablet, desktop)
- PWA básica (instalable)

### 🚀 v2 (posterior - Integración IA)
- **OpenAI API integration** (gpt-4o-mini)
- Sugerencias de recetas por ingredientes disponibles
- Chat contextuado sobre cocina
- TODO: Endpoint `/api/v1/ai/suggest`
- TODO: OpenAI API key en .env

### ❌ Fuera del scope
- Escaneo de imágenes (visión artificial)
- Cálculo de calorías/nutrición
- Social (comentarios, compartir públicamente)
- Sincronización offline del móvil
- Historial de compras
- Bot Telegram (feature extra futura)

---

## 🏗️ Stack tecnológico

### Backend
- **Python 3.12** — lenguaje
- **FastAPI 0.115** — framework web (async, Swagger automático)
- **SQLAlchemy 2.0** — ORM (async con asyncpg en prod)
- **Pydantic 2.13** — validación de schemas
- **python-jose + passlib** — autenticación JWT + hashing Argon2
- **Alembic 1.14** — migraciones de BD
- **httpx** — cliente HTTP (para OpenAI en v2)

### Base de datos
- **SQLite** en desarrollo (archivo local, sin dependencias)
- **PostgreSQL 15** en producción (Render)
- **asyncpg** — driver PostgreSQL async para FastAPI

### Frontend
- **React 18.3** + React Router 6 — interfaz web SPA
- **Vite 6.3** — build tool (rápido, dev server con proxy)
- **TailwindCSS** — estilos (utility-first, responsive)
- **@radix-ui** — componentes accesibles y sin estilos por defecto
- **Framer Motion** — animaciones suaves
- **date-fns** — manipulación de fechas (importante para planner)

### Deployment
- **Vercel** — hosting frontend (gratuito, auto-deploy)
- **Render** — hosting backend + PostgreSQL ($7/mes crédito gratis, luego ~$12/mes)
- **Docker + docker-compose** — para desarrollo local

---

## 📁 Estructura de directorios (MVP)

```
recetaria/
├── backend/
│   ├── app/
│   │   ├── main.py                    ← Entrada de FastAPI
│   │   │
│   │   ├── core/
│   │   │   ├── config.py              ← Configuración (env, BD URL)
│   │   │   ├── security.py            ← JWT, hashing, Argon2
│   │   │   └── database.py            ← SQLAlchemy engine, SessionLocal, Base
│   │   │
│   │   ├── models/                    ← Modelos SQLAlchemy (tablas)
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── recipe.py
│   │   │   ├── ingredient.py
│   │   │   ├── category.py
│   │   │   ├── recipe_ingredient.py
│   │   │   ├── favorite.py
│   │   │   ├── meal_plan.py
│   │   │   └── shopping_item.py
│   │   │
│   │   ├── schemas/                   ← Schemas Pydantic (request/response)
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── recipe.py
│   │   │   ├── ingredient.py
│   │   │   └── shopping.py
│   │   │
│   │   ├── routers/                   ← Endpoints organizados por dominio
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                ← POST /auth/register, /auth/login, /auth/refresh
│   │   │   ├── recipes.py             ← GET/POST/PUT/DELETE /recipes
│   │   │   ├── ingredients.py         ← GET /ingredients
│   │   │   ├── shopping.py            ← POST /shopping/generate, GET/DELETE /shopping
│   │   │   ├── meal_plan.py           ← POST/DELETE /meal-plan
│   │   │   ├── admin.py               ← GET/DELETE /admin/users
│   │   │   └── ai.py                  ← TODO: v2 - OpenAI integration (vacío por ahora)
│   │   │
│   │   ├── services/                  ← Lógica de negocio (sin HTTP, testeable)
│   │   │   ├── __init__.py
│   │   │   ├── recipe_service.py      ← búsqueda, filtros, favoritos
│   │   │   ├── shopping_service.py    ← generación lista, deduplicación
│   │   │   ├── meal_plan_service.py   ← organización semanal
│   │   │   └── ai_service.py          ← TODO: v2 - OpenAI calls (vacío por ahora)
│   │   │
│   │   └── dependencies.py            ← get_db(), get_current_user(), require_role()
│   │
│   ├── alembic/                       ← Migraciones de BD
│   │   └── versions/
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_recipes.py
│   │   ├── test_shopping.py
│   │   └── test_meal_plan.py
│   │
│   ├── media/                         ← Imágenes subidas
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── RecipeCard.jsx
│   │   │   ├── ShoppingListItem.jsx
│   │   │   ├── MealPlanDay.jsx
│   │   │   └── forms/
│   │   │       ├── RecipeForm.jsx
│   │   │       └── LoginForm.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RecipesPage.jsx
│   │   │   ├── RecipeDetailPage.jsx
│   │   │   ├── ShoppingListPage.jsx
│   │   │   ├── MealPlanPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useRecipes.js
│   │   │   ├── useShopping.js
│   │   │   └── useMealPlan.js
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── recipeService.js
│   │   │   ├── shoppingService.js
│   │   │   └── aiService.js           ← TODO: v2 - preparado pero sin usar
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env
│
├── docker-compose.yml
├── Dockerfile
├── CLAUDE.md
├── SKILL.md
└── README.md
```

---

## 🗄️ Esquema de base de datos (MVP)

### Tablas principales

**users**
```sql
id              SERIAL PRIMARY KEY
username        VARCHAR(50) UNIQUE NOT NULL
password        VARCHAR(255) NOT NULL
role            ENUM('user', 'admin') DEFAULT 'user'
created_at      TIMESTAMP DEFAULT now()
```

**categories**
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(50) UNIQUE NOT NULL
slug            VARCHAR(50) UNIQUE NOT NULL
```

**recipes**
```sql
id              SERIAL PRIMARY KEY
title           VARCHAR(200) NOT NULL
description     TEXT
time_min        INTEGER
difficulty      ENUM('facil', 'media', 'dificil')
image_path      VARCHAR(300)
user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
category_id     INTEGER NOT NULL REFERENCES categories(id)
created_at      TIMESTAMP DEFAULT now()
```

**ingredients**
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100) UNIQUE NOT NULL
```

**recipe_ingredients** [many-to-many]
```sql
recipe_id       INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
ingredient_id   INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE
quantity        VARCHAR(50) NOT NULL
unit            VARCHAR(30) NOT NULL
PRIMARY KEY (recipe_id, ingredient_id)
```

**favorites** [many-to-many]
```sql
user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
recipe_id       INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
PRIMARY KEY (user_id, recipe_id)
```

**meal_plan**
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
recipe_id       INTEGER NOT NULL REFERENCES recipes(id)
date            DATE NOT NULL
meal_type       ENUM('desayuno', 'comida', 'cena', 'merienda')
created_at      TIMESTAMP DEFAULT now()
```

**shopping_list**
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
ingredient_name VARCHAR(100) NOT NULL
total_quantity  VARCHAR(50) NOT NULL
unit            VARCHAR(30)
checked         BOOLEAN DEFAULT false
created_at      TIMESTAMP DEFAULT now()
```

---

## 🔄 Flujos principales (MVP)

### 1. Registro e inicio de sesión
```
User → /api/v1/auth/register {username, password}
  → Backend hashea (Argon2)
  → Crea usuario con role='user'
  → Devuelve JWT token

User → /api/v1/auth/login {username, password}
  → Valida credenciales
  → Devuelve { access_token, refresh_token }
  → Frontend guarda en localStorage
```

### 2. Crear recetas
```
User → Formulario con:
  - title, description
  - category, time_min, difficulty
  - ingredientes (tabla: nombre, cantidad, unidad)
  - image (upload)

Frontend → POST /api/v1/recipes
  → Backend guarda receta + ingredientes
  → Sube imagen a /media/
  → Devuelve RecipeResponse
```

### 3. Generar lista de compra (corazón del MVP)
```
User → Selecciona 3 recetas (checkboxes)
  → Click "Generar lista"

Frontend → POST /api/v1/shopping/generate { recipe_ids: [1, 3, 5] }

Backend (shopping_service.py):
  1. Obtiene ingredientes de cada receta
  2. Agrupa por (ingredient_name, unit)
  3. Suma cantidades numéricas
  4. Deduplica
  5. Guarda en shopping_list

Devuelve:
  {
    items: [
      { ingredient_name: "tomate", total_quantity: "400", unit: "g" },
      { ingredient_name: "cebolla", total_quantity: "2", unit: "unidades" }
    ]
  }

Frontend → Muestra lista con checkboxes
```

### 4. Planner semanal
```
User → Navega a /meal-plan
  → Ve calendario lunes-domingo
  → Para cada día: desayuno, comida, cena
  → Selecciona recetas

Frontend → POST /api/v1/meal-plan { recipe_id, date, meal_type }

User → Click "Generar lista semanal"
  → POST /api/v1/meal-plan/generate-shopping
  → Backend suma ingredientes
  → Devuelve lista deduplicada
```

### TODO: v2 - Sugerencias con IA
```
User → Input: "Tengo pollo, arroz, queso"
  → Frontend → POST /api/v1/ai/suggest { ingredients: [...] }
  
Backend (ai_service.py):
  - Llama OpenAI API
  - Devuelve sugerencias en español

Frontend → Muestra respuesta de IA
```

---

## 🔐 Autenticación y autorización (MVP)

### JWT Flow
1. Login → Backend devuelve `access_token` (30 min) + `refresh_token` (7 días)
2. Frontend guarda en localStorage
3. Cada request: `Authorization: Bearer {access_token}`
4. Backend valida con `get_current_user()` (dependency)
5. Si token expira → usar refresh_token

### Roles
- **user**: crear/editar propias recetas, usar lista compra
- **admin**: crear/editar cualquier receta, eliminar usuarios

---

## 💡 Decisiones arquitectónicas

### Por qué FastAPI + async
- Múltiples usuarios simultáneos sin bloqueos
- SQLAlchemy 2.0 con asyncpg en producción
- Swagger automático (bueno para portfolio)

### Por qué SQLAlchemy + Alembic
- Migraciones versionadas
- ORM flexible (SQLite → PostgreSQL: cambio 1 línea)
- Relaciones automáticas

### Por qué React + Vite
- SPA reactiva
- Vite = dev rápido, build optimizado
- React Router = routing cliente

### Por qué PostgreSQL en prod
- Soporte múltiples conexiones simultáneas
- SQLite es desarrollo, limitado en concurrencia
- Render: PostgreSQL manejado ~$12/mes

### SIN IA en MVP
- Scope reducido → MVP en 9-10 semanas
- IA se agrega en v2 (plug-and-play)
- Sin necesidad de crédito OpenAI en fase 1

---

## 📋 Convenciones del código

### Backend (Python)
- **Nombres**: `snake_case`
- **Clases**: `PascalCase`
- **Type hints**: siempre
- **Errores**: `HTTPException` con códigos HTTP semánticos
- **DB**: normalizar ingredientes → `name.strip().lower()`

### Frontend (React)
- **Componentes**: `PascalCase.jsx`
- **Funciones**: `camelCase`
- **Hooks**: `use*`
- **CSS**: Tailwind + CSS modules si necesario

### API Responses
```javascript
{ items: [...], total: 10, page: 1, size: 10 }  // listas
{ data: {...}, message: "success" }               // single
{ detail: "Error", status: 404 }                  // errors
```

---

## 🛣️ Roadmap MVP (10-11 semanas, SIN IA)

### Fase 0 — Setup (Semana 1)
- [ ] Inicializar repo + estructura
- [ ] Docker compose (PostgreSQL local)
- [ ] FastAPI + React setup
- [ ] Primera migración Alembic

### Fase 1 — Autenticación (Semanas 2-3)
- [ ] Modelo User + role
- [ ] Endpoints register/login/refresh
- [ ] JWT + refresh tokens
- [ ] Middleware get_current_user
- [ ] Login page React

### Fase 2 — Recetas (Semanas 4-5)
- [ ] Modelos Recipe, Ingredient, Category
- [ ] CRUD endpoints recetas
- [ ] Subida de imágenes
- [ ] Página listado + detalle
- [ ] Formulario crear/editar

### Fase 3 — Lista de compra (Semana 6)
- [ ] Lógica generador (deduplicación, suma)
- [ ] Endpoints /shopping/generate
- [ ] Página lista compra (checkboxes)

### Fase 4 — Búsqueda + Favoritos (Semana 7)
- [ ] Filtros SQL
- [ ] Buscador dinámico
- [ ] Many-to-many favorites
- [ ] Icono favorito en cards

### Fase 5 — Responsive + Pulir (Semana 8)
- [ ] Mobile-first design
- [ ] PWA básica
- [ ] Animaciones Framer Motion
- [ ] Tests básicos

### Fase 6 — Planner semanal (Semanas 9-10)
- [ ] Modelo MealPlan
- [ ] Calendario dinámico React
- [ ] Endpoints /meal-plan
- [ ] Generar lista semanal

### Fase 7 — Deploy + Tests (Semana 11)
- [ ] Render setup
- [ ] Vercel setup
- [ ] Tests más completos
- [ ] Documentación README

### Fase 8 — v2 (posterior, 1-2 semanas)
- **TODO: Integración OpenAI**
  - [ ] OpenAI API key en .env
  - [ ] Router /api/v1/ai/suggest (descomentar)
  - [ ] Service ai_service.py (implementar)
  - [ ] Componentes React para IA
  - [ ] Prompt engineering en español
  - [ ] Tests para endpoints IA

---

## 🚀 Notas importantes

### Antes de empezar
1. Lee CLAUDE.md + SKILL.md
2. Copia `.env.example` a `.env`
3. `docker-compose up -d` para PostgreSQL
4. Verifica conexión a BD

### Enfoques
- MVP sin IA: funciona, profesional, menos complejidad
- v2 con IA: feature adicional, no crítica

### Testing
- Escribe tests mientras desarrollas (menos bugs después)
- Focus: auth, shopping (lógica crítica), API endpoints

### Deploy
- Dev: localhost:8000 + localhost:3000
- Prod: Render (backend) + Vercel (frontend)

---

**Última actualización:** Junio 2024  
**Versión:** 0.1.0 (MVP sin IA)  
**v2:** Próxima iteración con OpenAI integration
