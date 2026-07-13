# RecetarIA — Planning del Proyecto

**Última actualización:** Julio 2026  
**Status:** Fase 1 iniciada  
**Usuarios objetivo:** 2-3 personas + 1 admin  
**MVP:** ~11 semanas (sin IA)  

---

## 📊 Timeline de alto nivel

```
Fase 0 — Setup
├── Semana 1
└── Status: ✅ COMPLETADA

Fase 1 — Autenticación
├── Semanas 2-3
└── Status: ✅ COMPLETADA

Fase 2 — Recetas CRUD
├── Semanas 4-5
└── Status: ✅ COMPLETADA

Fase 3 — Lista de Compra
├── Semana 6
└── Status: ✅ COMPLETADA

Fase 4 — Búsqueda + Favoritos
├── Semana 7
└── Status: ✅ COMPLETADA

Fase 5 — Planner Semanal
├── Semanas 8-9
└── Status: ✅ COMPLETADA

Fase 6 — Responsive + Deploy
├── Semanas 10-11
└── Status: ⏳ Pending

Fase 7 — Tests + Pulir
├── Semana 12
└── Status: ⏳ Pending

v2 — IA Integration (posterior)
└── 1-2 semanas adicionales
```

---

## 📋 Desglose por Fase

### FASE 0 — Setup (Semana 1)

**Status:** ✅ COMPLETADA

**Tareas:**
- [x] Estructura de carpetas backend + frontend
- [x] docker-compose.yml (PostgreSQL)
- [x] requirements.txt (Python)
- [x] package.json (Node/React)
- [x] .env.example y .env (backend + frontend)
- [x] FastAPI básico (main.py)
- [x] React + Vite básico (App.jsx)
- [x] Alembic inicializado
- [x] settings.local.json (permisos Claude Code)
- [x] CLAUDE.md + SKILL.md + documentación

**Deliverables:**
- ✅ Backend corriendo en http://localhost:8000/docs
- ✅ Frontend corriendo en http://localhost:5173
- ✅ PostgreSQL accesible en docker
- ✅ Todos los archivos de configuración listos

**Próxima fase:** Autenticación

---

### FASE 1 — Autenticación (Semanas 2-3)

**Status:** ✅ COMPLETADA

**Descripción:**
Sistema de autenticación JWT con roles (user, admin). Sin esto, no puede haber features posteriores.

**Backend:**
- [x] Modelo User (username, password, role, timestamps) — originalmente `email`, reemplazado por `username` durante la Fase 5 a petición del usuario
- [x] Schemas Pydantic (register, login, token, response)
- [x] Router auth (POST /auth/register, /auth/login, /auth/refresh)
- [x] Service auth (lógica de negocio sin HTTP)
- [x] Conectar security.py (JWT + Argon2)
- [x] Conectar dependencies.py (get_current_user)
- [x] Migración Alembic (crear tabla users)
- [x] Validaciones (username único y alfanumérico, password >= 8 chars)
- [x] Tests pytest para auth (7/7 passed originalmente; ampliados a username en Fase 5)

**Frontend:**
- [x] LoginPage (componente)
- [x] RegisterPage (componente)
- [x] useAuth() hook (login, logout, register, isAuthenticated) — vía AuthContext
- [x] ProtectedRoute (wrapper para rutas privadas)
- [x] API interceptor (agregar Authorization header)
- [x] App.jsx actualizado con rutas

**Deliverables:**
- ✅ Endpoint POST /auth/register funcional
- ✅ Endpoint POST /auth/login funcional
- ✅ Endpoint POST /auth/refresh funcional
- ✅ LoginPage funcional
- ✅ Usuarios pueden registrarse e iniciar sesión
- ✅ Tokens JWT almacenados en localStorage
- ✅ Tests pasando

**Dependencias:** Fase 0 ✅

**Próxima fase:** Recetas CRUD

---

### FASE 2 — Recetas CRUD (Semanas 4-5)

**Status:** ✅ COMPLETADA

**Descripción:**
Crear, leer, actualizar, eliminar recetas. Core del proyecto.

**Backend:**
- [x] Modelos: Recipe, Ingredient, Category, RecipeIngredient
- [x] Schemas: RecipeCreate, RecipeUpdate, RecipeResponse
- [x] Router recipes (GET, POST, PUT, DELETE /recipes, /recipes/{id})
- [x] Router categories (GET /categories) e ingredients (GET /ingredients, autocompletado)
- [x] Service recipe (lógica CRUD, normalización de ingredientes)
- [x] Subida de imágenes (multipart/form-data) — POST /recipes/{id}/image
- [x] Guardar imágenes en /media (servidas vía StaticFiles)
- [x] Migraciones Alembic (nuevas tablas + seed de 7 categorías por defecto)
- [x] Tests para CRUD (10 tests, incluye ownership y deduplicación)

**Frontend:**
- [x] RecipesPage (listado)
- [x] RecipeDetailPage (detalle + cambio de imagen)
- [x] RecipeFormPage + RecipeForm (crear/editar, ingredientes dinámicos)
- [x] RecipeCard (componente reutilizable)
- [x] useRecipes() hook
- [x] Upload de imagen
- [x] Navegación entre páginas (rutas /recipes, /recipes/new, /recipes/:id, /recipes/:id/edit)

**Notas de implementación:**
- Búsqueda y filtros avanzados (nombre, categoría, dificultad, tiempo) se dejan para Fase 4 según el roadmap original.
- "Usuarios solo ven recetas propias" aplica también a GET de una receta individual (no solo al listado); admin puede editar/eliminar cualquiera.

**Deliverables:**
- ✅ Endpoint GET /recipes (listar todas)
- ✅ Endpoint GET /recipes/{id} (detalle)
- ✅ Endpoint POST /recipes (crear)
- ✅ Endpoint PUT /recipes/{id} (editar)
- ✅ Endpoint DELETE /recipes/{id} (eliminar)
- ✅ Subida de imágenes funcional
- ✅ Usuario puede crear/editar/eliminar sus recetas
- ✅ Usuarios solo ven recetas propias (por ahora)

**Dependencias:** Fase 1 ✅

**Próxima fase:** Lista de compra

---

### FASE 3 — Lista de Compra (Semana 6)

**Status:** ✅ COMPLETADA

**Descripción:**
Corazón de RecetarIA. Seleccionar recetas → generar lista automática con ingredientes deduplicados.

**Backend:**
- [x] Modelo ShoppingItem (tabla `shopping_list`)
- [x] Schemas ShoppingGenerateRequest, ShoppingItemResponse, ShoppingItemUpdate, ShoppingListResponse
- [x] Endpoint POST /shopping/generate (recibe recipe_ids, devuelve lista; valida ownership de las recetas)
- [x] Service shopping_service (deduplicación, suma de cantidades)
- [x] Algoritmo: agrupar por (ingredient_name, unit), sumar cantidades numéricas o concatenar si no son numéricas
- [x] Endpoint GET /shopping (ver lista actual)
- [x] Endpoint DELETE /shopping (limpiar lista)
- [x] Endpoint PATCH /shopping/{id}/check (marcar/desmarcar como comprado)
- [x] Tests para shopping (8 tests: suma numérica, concatenación, ownership, reemplazo, check, clear)

**Frontend:**
- [x] Navbar (Recetas / Lista de compra / Cerrar sesión) integrado en ProtectedRoute
- [x] ShoppingListPage (selector de recetas + lista, combinados en una sola página)
- [x] ShoppingListItem (componente)
- [x] useShopping() hook (con actualización optimista al marcar/desmarcar)
- [x] Botón "Generar lista"
- [x] Marcar/desmarcar items como comprados

**Database:**
- [x] Tabla shopping_list

**Deliverables:**
- ✅ Endpoint POST /shopping/generate funcional
- ✅ Deduplicación de ingredientes funcionando
- ✅ Lista muestra cantidad sumada correcta (verificado con servidor real: 2+3 huevos → 5)
- ✅ Frontend permite generar lista
- ✅ Usuario puede marcar items comprados
- ✅ Ingredientes normalizados (case-insensitive, ya garantizado desde Fase 2)

**Notas de implementación:**
- Se combinó `RecipeSelectorPage` + `ShoppingListPage` en una sola página para simplificar la navegación (MVP con 2-3 usuarios); no se creó una página separada de selección.
- Cada `POST /shopping/generate` reemplaza la lista anterior del usuario (regeneración desde cero), no la acumula.
- Cantidades no numéricas (p. ej. "al gusto") se concatenan en vez de sumarse, evitando errores silenciosos.

**Dependencias:** Fase 2 ✅

**Próxima fase:** Búsqueda + Favoritos

---

### FASE 4 — Búsqueda + Favoritos (Semana 7)

**Status:** ✅ COMPLETADA

**Descripción:**
Permitir búsqueda avanzada y guardar recetas favoritas.

**Decisión de diseño (confirmada con el usuario):** el recetario pasa a ser compartido entre todos los usuarios — `GET /recipes` y `GET /recipes/{id}` ahora muestran/permiten leer las recetas de cualquier usuario, no solo las propias. Editar/eliminar/subir imagen sigue restringido al dueño o admin. Por consistencia, la generación de lista de compra (Fase 3) también admite recetas de cualquier usuario.

**Backend:**
- [x] Modelo Favorite (many-to-many users ↔ recipes)
- [x] Filtros SQL en recipes: nombre (`ilike`), categoría, dificultad, tiempo máximo
- [x] Endpoint GET /recipes con parámetros: ?q=, ?category_id=, ?difficulty=, ?time_max=, ?favorites_only=
- [x] Endpoint POST /recipes/{id}/favorite (agregar favorito, idempotente)
- [x] Endpoint DELETE /recipes/{id}/favorite (quitar favorito, idempotente)
- [x] Endpoint GET /auth/me (nuevo; necesario para que el frontend sepa ownership/role)
- [x] Service con lógica de búsqueda (search_recipes, apply_recipe_filters)
- [x] Tests (12 nuevos: filtros combinables, favoritos idempotentes, favoritos por usuario, /auth/me)

**Frontend:**
- [x] SearchBar (input con debounce + categoría, dificultad, tiempo máx., checkbox favoritos)
- [x] Búsqueda dinámica (debounced, 300ms)
- [x] Estrella de favorito en RecipeCard y en RecipeDetailPage
- [x] Filtros UI combinables
- [x] useRecipes hook mejorado con filtros + toggleFavorite optimista
- [x] Página de favoritos vía `/recipes?favorites=true` (enlace "Favoritos" en Navbar), no como página separada
- [x] AuthContext ahora carga el perfil real (`user`) vía /auth/me; RecipeCard/RecipeDetailPage ocultan Editar/Eliminar a quien no es dueño ni admin

**Database:**
- [x] Tabla favorites

**Deliverables:**
- ✅ Búsqueda por nombre (ILIKE, case-insensitive)
- ✅ Filtros por categoría funcionando
- ✅ Filtros por dificultad
- ✅ Filtros por tiempo máximo
- ✅ Múltiples filtros combinables (verificado con servidor real)
- ✅ Favoritos persistidos en BD, por usuario (verificado que no se cruzan entre usuarios)
- ✅ Icono de favorito en UI

**Dependencias:** Fase 2 ✅

**Próxima fase:** Planner semanal

---

### FASE 5 — Planner Semanal (Semanas 8-9)

**Status:** ✅ COMPLETADA

**Descripción:**
Organizar recetas por día y tipo. Generar lista de compra semanal.

**Nota:** el schema de `CLAUDE.md` define 4 tipos de comida (`desayuno, comida, cena, merienda`), no 3 como decía el resumen de esta fase — se implementaron los 4 tal como están en el modelo de datos.

**Fix de correctitud aplicado antes de empezar (no estaba en el plan original):** `Favorite` (Fase 4) tenía FK con `ondelete="CASCADE"` pero sin relación ORM hacia `Recipe`; en SQLite esa cascada es inerte sin `PRAGMA foreign_keys=ON`, así que borrar una receta dejaba filas huérfanas en `favorites` (verificado y reproducido). Se activó la pragma en `database.py` y en el engine de tests, y se añadió un test de regresión. `MealPlan` se creó ya con la relación ORM correcta desde el inicio.

**Backend:**
- [x] Modelo MealPlan (con `ondelete="CASCADE"` hacia recipes, no especificado explícitamente en el schema de CLAUDE.md pero consistente con el resto de FKs a recipes)
- [x] Schemas MealPlanCreate, MealPlanResponse, MealPlanListResponse
- [x] Endpoint POST /meal-plan (asignar receta a día/tipo)
- [x] Endpoint GET /meal-plan?week=2026-W28 (ver semana, formato ISO)
- [x] Endpoint DELETE /meal-plan/{id} (quitar comida)
- [x] Endpoint POST /meal-plan/generate-shopping?week= (lista semanal)
- [x] Service meal_plan_service (reutiliza build_shopping_items/replace_shopping_list de shopping_service)
- [x] Tests (13 nuevos, incluye que una receta repetida en la semana suma sus ingredientes x2)

**Frontend:**
- [x] MealPlanPage (calendario semanal, navegación semana anterior/actual/siguiente)
- [x] MealPlanDay (componente por día, dropdown para añadir receta por tipo de comida)
- [x] useMealPlan() hook (usa date-fns para semanas ISO)
- [x] Botón "Generar lista de compra semanal" (navega a /shopping tras generar)
- [x] Vista de lunes-domingo

**Database:**
- [x] Tabla meal_plan

**Deliverables:**
- ✅ Vista de semana (lunes-domingo)
- ✅ 4 tipos de comida por día (desayuno, comida, merienda, cena)
- ✅ Agregar receta a día/tipo
- ✅ Remover comida de planner
- ✅ Generar lista compra semanal
- ✅ Deduplicación funciona con múltiples días (verificado con servidor real: misma receta lunes+miércoles → cantidad x2)

**Dependencias:** Fase 3 ✅, Fase 4 ✅

**Próxima fase:** Responsive + Deploy

---

### FASE 6 — Responsive + Deploy (Semanas 10-11)

**Status:** 🟡 Código completo — deploy real pendiente (acción manual del usuario)

**Descripción:**
Hacer la app mobile-friendly y dejarla lista para desplegar en producción.
Alcance decidido con el usuario: esta fase cubre solo preparación de código
(responsive, PWA, Dockerfile, blueprints de deploy). El deploy real (crear
cuentas, conectar repo, cargar secretos) queda documentado como guía manual
al final de esta sección — ver "Guía de deploy manual" más abajo.

**Bug crítico detectado y corregido antes de tocar nada más:** `backend/requirements.txt`
instala `psycopg` v3, pero SQLAlchemy resuelve un `DATABASE_URL` con esquema
`postgres://`/`postgresql://` al driver psycopg2 (no instalado) por defecto.
Sin corregirlo, el backend habría roto en el primer arranque real contra
Postgres en Render, con un traceback silencioso hasta ese momento porque dev
usa SQLite. Se agregó normalización de esquema en `database.py`
(`postgres://`/`postgresql://` → `postgresql+psycopg://`).

**Frontend:**
- [x] Mobile-first design (patrón: stack por defecto, `sm:`/`md:` para grid/fila)
- [x] Breakpoints: se usan los de Tailwind por defecto (sm=640/md=768/lg=1024),
      ya coinciden con lo pedido; no hizo falta tocar `tailwind.config.js`
- [x] NavBar responsive (hamburger menu) — reconstruido `Navbar.jsx` con panel
      colapsable en mobile, sin librería de iconos ni Radix (consistente con
      el resto del codebase)
- [x] Componentes responsivos: `RecipeForm.jsx` (grids), `SearchBar.jsx`
      (controles full-width en mobile), `RecipeDetailPage.jsx` (header apilable)
- [x] Touch-friendly: checkboxes de `ShoppingListItem.jsx`/`ShoppingListPage.jsx`
      a `w-5 h-5` con más padding vertical
- [x] PWA básica (`vite-plugin-pwa`: manifest.webmanifest + service worker
      autogenerados, iconos 192x192/512x512 rasterizados desde el `LogoIcon`
      existente, `registerType: autoUpdate`, sin cache de respuestas de API)
- [ ] Lighthouse score > 80 — no verificado en esta sesión (requiere build
      desplegado o `vite preview`; queda para cuando haya URL real)

**Backend:**
- [x] Dockerfile (para Render) — `backend/Dockerfile`, Python 3.12-slim, uvicorn
      con `$PORT` dinámico
- [x] CORS configurado para dominio de Vercel — nuevo `cors_origins` (string
      separado por coma) en `config.py`, usado en `main.py` cuando `DEBUG=False`
- [x] Migraciones a PostgreSQL en producción — normalización de URL en
      `database.py` (ver bug crítico arriba); las migraciones en sí se corren
      manualmente tras el deploy (decisión confirmada, ver guía)
- [x] Variables de entorno en Render — placeholders en `render.yaml`
      (`SECRET_KEY`, `CORS_ORIGINS`, `OPENAI_API_KEY` como `sync: false`)
- [x] Health check endpoint — ya existía (`GET /health`), reutilizado en
      `render.yaml` (`healthCheckPath`)

**Deployment (blueprints listos, ejecución manual pendiente):**
- [x] `vercel.json` en la raíz (build del monorepo apuntando a `frontend/`)
- [x] `render.yaml` en la raíz (web service Docker + `databases:` para
      Postgres, provisionados juntos en un solo blueprint apply)
- [ ] Setup Vercel (frontend) — pendiente, acción manual del usuario
- [ ] Setup Render (backend + PostgreSQL) — pendiente, acción manual del usuario
- [ ] Conectar ambos (actualizar `CORS_ORIGINS` con el dominio real de Vercel)
- [ ] SSL/HTTPS automático — lo maneja Vercel/Render por defecto, sin config extra
- [ ] CI/CD básico — fuera de alcance de esta fase (decisión confirmada)

**Tests:**
- [x] Verificar responsiva en móvil — Playwright headless a 375px: navbar
      (hamburguesa/panel), RecipeForm, RecipeDetailPage, SearchBar; sin errores
      de consola. Capturas revisadas visualmente.
- [x] `pytest` backend: 50/50 en verde tras los cambios de `database.py`/`config.py`/`main.py`
- [x] `npm run build`: compila limpio, genera `sw.js`, `manifest.webmanifest`
      con los iconos correctos
- [ ] Verificar performance (Lighthouse) — pendiente, ver nota arriba
- [ ] Verificar que funciona en producción — pendiente hasta el deploy real
- [ ] `docker build` del backend — Docker Desktop no estaba corriendo en esta
      máquina; Dockerfile revisado línea por línea pero no probado con un build
      real, queda pendiente para el primer deploy

**Deliverables:**
- ✅ App responsive en mobile/tablet/desktop (verificado con capturas)
- ✅ PWA instalable (manifest + service worker generados)
- ✅ Código listo para deploy (Dockerfile, render.yaml, vercel.json)
- ⏳ Frontend deployado en Vercel — pendiente (usuario)
- ⏳ Backend deployado en Render — pendiente (usuario)
- ⏳ BD PostgreSQL en Render — pendiente (usuario)
- ⏳ App accesible en URL pública — pendiente (usuario)

**Dependencias:** Fase 5 ✅

**Próxima fase:** Tests + Pulir (o completar el deploy manual primero)

---

#### Guía de deploy manual (pendiente, a cargo del usuario)

1. **Vercel (frontend):** crear proyecto nuevo apuntando al repo de GitHub.
   `vercel.json` en la raíz ya define el build (`cd frontend && npm install &&
   npm run build`) y el `outputDirectory` (`frontend/dist`) — no hace falta
   tocar nada en el dashboard salvo confirmar el import del repo.
2. **Render (backend + Postgres):** crear un Blueprint apuntando al repo;
   `render.yaml` provisiona el web service (Docker, `backend/Dockerfile`) y la
   base de datos Postgres juntos. Cargar manualmente en el dashboard los
   `envVars` marcados `sync: false`: `SECRET_KEY` (generar uno nuevo, no
   reusar el de dev) y `OPENAI_API_KEY` (vacío está bien por ahora).
3. **Conectar ambos:** una vez Vercel asigne el dominio final, actualizar la
   env var `CORS_ORIGINS` en Render con esa URL (separar por coma si hay
   varias, p. ej. producción + preview).
4. **Migraciones:** tras el primer deploy exitoso del backend, correr
   `alembic upgrade head` manualmente desde el shell de Render (decisión
   confirmada: no automatizado en el arranque del contenedor).
5. **Verificar:** `GET /health` del backend debe responder `{"status":"ok"}`;
   probar login/registro contra el dominio real de Vercel para confirmar que
   el CORS quedó bien configurado.

### FASE 7 — Tests + Pulir (Semana 12)

**Status:** ⏳ Pending

**Descripción:**
Escribir tests completos y pulir detalles.

**Backend:**
- [ ] Tests unitarios para cada service
- [ ] Tests de integración para endpoints
- [ ] Cobertura >= 70%
- [ ] pytest + pytest-asyncio
- [ ] Fixtures para BD de prueba

**Frontend:**
- [ ] Tests unitarios para componentes (React Testing Library)
- [ ] Tests de hooks
- [ ] Vitest para testing

**Pulido:**
- [ ] Revisar código con SKILL-clean-code.md
- [ ] Refactorizar funciones largas
- [ ] Mejorar nombres de variables
- [ ] Eliminar código muerto
- [ ] Actualizar documentación
- [ ] README completo
- [ ] CHANGELOG

**Performance:**
- [ ] Optimizar queries SQL
- [ ] Lazy loading de imágenes
- [ ] Memoization en React donde necesario
- [ ] Bundles optimizados

**Deliverables:**
- ✅ Cobertura de tests >= 70%
- ✅ Todos los tests pasando
- ✅ Código limpio y legible
- ✅ Documentación actualizada
- ✅ Performance aceptable

**Dependencias:** Todas las fases anteriores ✅

**Próxima fase:** v2 (IA)

---

## 🚀 v2 — Integración IA (Posterior - 1-2 semanas)

**Status:** 🔜 Planned

**Descripción:**
Agregar sugerencias de recetas con OpenAI.

**Backend:**
- [ ] Endpoint POST /api/v1/ai/suggest
- [ ] Service ai_service (llamadas OpenAI)
- [ ] Prompt engineering en español
- [ ] Caché de respuestas (Redis)
- [ ] Tests para IA

**Frontend:**
- [ ] AIPage (componente)
- [ ] Chat-like UI
- [ ] Mostrar sugerencias
- [ ] useAI() hook

**Deliverables:**
- ✅ Usuario puede escribir ingredientes
- ✅ IA sugiere recetas
- ✅ Sugerencias son contextuadas (recetas propias)
- ✅ UI amigable

**Dependencias:** Fase 7 ✅

---

## 📊 Tabla resumen

| Fase | Semanas | Estado | Tareas | Prioridad |
|------|---------|--------|-------|-----------|
| **0 — Setup** | 1 | ✅ Done | 10 | 🔴 Crítica |
| **1 — Auth** | 2-3 | ✅ Done | 13 | 🔴 Crítica |
| **2 — Recetas** | 4-5 | ✅ Done | 13 | 🔴 Crítica |
| **3 — Compra** | 6 | ✅ Done | 10 | 🔴 Crítica |
| **4 — Búsqueda** | 7 | ✅ Done | 13 | 🟡 Alta |
| **5 — Planner** | 8-9 | ✅ Done | 13 | 🟡 Alta |
| **6 — Deploy** | 10-11 | 🟡 Código listo, deploy manual pendiente | 8 | 🟡 Alta |
| **7 — Tests** | 12 | ⏳ Todo | 6 | 🟢 Media |
| **v2 — IA** | +1-2 | 🔜 Planned | 5 | 🟢 Baja |

---

## 🎯 Dependencias de Fases

```
Fase 0 ✅
  └── Fase 1 ✅ (Autenticación necesaria para todo)
      ├── Fase 2 ✅ (CRUD recetas)
      │   ├── Fase 3 ✅ (Lista compra)
      │   │   └── Fase 5 ✅ (Planner)
      │   │       └── Fase 6 ⏳ (Deploy)
      │   │           └── Fase 7 ⏳ (Tests)
      │   │               └── v2 🔜 (IA)
      │   └── Fase 4 ✅ (Búsqueda + Favoritos)
```

---

## 📈 Métricas de progreso

**Completado:**
- ✅ Setup (Fase 0): 100% (1/1 semana)
- ✅ Autenticación (Fase 1): 100% (2/2 semanas)
- ✅ Recetas CRUD (Fase 2): 100% (2/2 semanas)
- ✅ Lista de Compra (Fase 3): 100% (1/1 semana)
- ✅ Búsqueda + Favoritos (Fase 4): 100% (1/1 semana)
- ✅ Planner Semanal (Fase 5): 100% (2/2 semanas)

**En progreso:**
- 🟡 Responsive + Deploy (Fase 6): código completo (responsive, PWA, Dockerfile,
  render.yaml, vercel.json); falta la ejecución manual del deploy (cuentas
  Vercel/Render) — ver guía en la sección de la Fase 6

**Pendiente:**
- ⏳ Deploy real (Vercel/Render) + Fase 7 (Tests) + v2 (IA)

**Total completado:** ~80% (código de 6/7 fases del MVP listo; falta ejecutar el deploy y la Fase 7)

---

## 🔧 Herramientas y Recursos

**Backend:**
- Python 3.12
- FastAPI 0.115
- SQLAlchemy 2.0
- PostgreSQL 15
- pytest
- Alembic

**Frontend:**
- React 18.3
- Vite 6.3
- TailwindCSS
- @radix-ui
- Framer Motion

**Dev Tools:**
- Cursor/VS Code
- Claude Code
- Docker Desktop
- Git

**Deploy:**
- Vercel (frontend)
- Render (backend + DB)

---

## 📚 Documentación

- CLAUDE.md — Contexto completo del proyecto
- SKILL.md — Stack y convenciones técnicas
- SKILL-clean-code.md — Guía de código limpio
- SKILL-update-doc.md — Sincronización de documentación
- settings.local.json — Permisos Claude Code
- PROMPT-*.md — Prompts para cada fase

---

## ✅ Checklist de inicio

Antes de cada fase:

- [ ] Leer descripción de fase
- [ ] Revisar dependencias
- [ ] Preparar prompt
- [ ] Ejecutar con Claude Code
- [ ] Validar tests
- [ ] Verificar en navegador
- [ ] Hacer commit
- [ ] Pasar a siguiente

---

## 📅 Estimaciones realistas

- **Setup:** ✅ 1 semana (DONE)
- **Auth:** 2-3 semanas
- **Recetas:** 2 semanas
- **Lista compra:** 1 semana
- **Features extras:** 3 semanas
- **Deploy + Tests:** 2 semanas
- **Pulir:** 1 semana

**Total MVP:** ~12 semanas (3 meses)
**v2 con IA:** +1-2 semanas

---

## 🚀 Próximos pasos inmediatos

1. ✅ Fase 1 — Autenticación completa (modelo User, endpoints, LoginPage, useAuth)
2. ✅ Fase 2 — Recetas CRUD completa (modelos, endpoints, subida de imágenes, RecipesPage/RecipeForm)
3. ✅ Fase 3 — Lista de Compra completa (deduplicación, suma de cantidades, ShoppingListPage, Navbar)
4. ✅ Fase 4 — Búsqueda + Favoritos completa (recetario compartido, filtros combinables, favoritos por usuario, /auth/me)
5. ✅ Fase 5 — Planner Semanal completa (MealPlan, calendario lunes-domingo, lista de compra semanal con deduplicación entre días)
6. ✅ Migraciones aplicadas: `alembic upgrade head` (tablas users, categories, ingredients, recipes, recipe_ingredients, shopping_list, favorites, meal_plan)
7. ✅ Verificado end-to-end: pytest (49/49), servidor real (planner con receta repetida en la semana suma x2, semana inválida → 422), build de frontend
8. ⏸️ Hacer commit (pendiente: el proyecto aún no es un repo git)
9. ➡️ Pasar a Fase 6: Responsive + Deploy

---

**Última actualización:** Julio 2026  
**Responsable:** Gherson (Téciman)  
**Status general:** On track
