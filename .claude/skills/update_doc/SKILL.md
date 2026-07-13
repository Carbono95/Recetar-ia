---
name: recetaria-update-doc
description: >
  Sincroniza la documentación en /doc cuando hay cambios en el código fuente.
  Analiza git diff, mapea el impacto a las categorías de /doc y actualiza solo
  los archivos .md afectados. Úsalo después de: agregar modelos, crear endpoints,
  implementar servicios, crear componentes React, cambiar variables de entorno.
  Devuelve solo tabla CLI con archivos modificados y razón del cambio.
argument-hint: "[ref git opcional, ej: HEAD~3..HEAD | --staged | ruta/archivo.py]"
---

# recetaria-update-doc — Sincronización automática de /doc

Eres un technical writer experto con conocimiento del stack de **RecetarIA** (FastAPI + React + PostgreSQL). Tu misión es mantener `/doc` sincronizado con la verdad absoluta del código fuente.

> **Restricción de output**: No imprimas el contenido completo de archivos generados.
> Al finalizar, muestra **únicamente la tabla resumen** del Paso 5.

---

## Paso 1 — Capturar contexto de modificación

Ejecuta los siguientes comandos para obtener el contexto de cambios:

```
!git status --short
```

```
!git diff HEAD
```

```
!git diff --cached
```

Si el usuario proporcionó un argumento (`$ARGUMENTS`), úsalo como rango de diff:

```
!git diff $ARGUMENTS -- 2>/dev/null || git diff HEAD
```

Si **no hay cambios** (`git status` devuelve limpio y diff vacío), informa al usuario y detente:

```
No se detectaron cambios en el repositorio.
Asegúrate de tener archivos modificados o en staging antes de ejecutar /recetaria-update-doc.
```

---

## Paso 2 — Análisis de impacto (Trazabilidad)

Analiza los archivos modificados en el diff y mapéalos con la siguiente matriz de trazabilidad. Un cambio puede impactar **múltiples secciones** de `/doc`.

### Matriz de trazabilidad

| Archivos fuente modificados | Secciones `/doc` impactadas | Qué actualizar |
|-----------------------------|-----------------------------|----------------|
| `backend/app/models/*.py` | `03-base-datos/esquema.md`, `03-base-datos/README.md` | Tabla de campos, diagrama ER, relaciones, constraints |
| `backend/alembic/versions/*.py` | `03-base-datos/migraciones.md` | Nueva migración, comando `alembic upgrade head` |
| `backend/app/routers/auth.py` | `04-backend/auth.md`, `02-arquitectura/autenticacion.md` | Endpoints auth, flujo JWT, roles |
| `backend/app/routers/recipes.py` | `04-backend/recipes-api.md` | Endpoints CRUD, parámetros, filtros, response models |
| `backend/app/routers/shopping.py` | `04-backend/shopping-api.md` | Endpoint generador lista, deduplicación, response |
| `backend/app/routers/meal_plan.py` | `04-backend/meal-plan-api.md` | Endpoints planner, calendar view, generation |
| `backend/app/routers/admin.py` | `04-backend/admin-api.md` | Endpoints admin (users, permissions) |
| `backend/app/core/deps.py` | `02-arquitectura/autenticacion.md`, `04-backend/README.md` | Guards, roles (user, admin), `get_current_user` |
| `backend/app/core/config.py` | `06-devops/env-vars.md` | Variables de entorno, valores por defecto |
| `backend/app/core/exceptions.py` | `02-arquitectura/errores.md` | Jerarquía de excepciones, códigos HTTP |
| `backend/app/services/*.py` | `04-backend/servicios.md` | Lógica de negocio, funciones principales |
| `backend/app/services/shopping_service.py` | `04-backend/servicios.md`, `03-base-datos/esquema.md` | Algoritmo deduplicación, suma de cantidades |
| `backend/app/services/recipe_service.py` | `04-backend/servicios.md` | CRUD recetas, búsqueda, favoritos |
| `backend/app/services/meal_plan_service.py` | `04-backend/servicios.md` | Gestión planner semanal, generación lista |
| `backend/app/schemas/*.py` | Archivo `.md` del endpoint correspondiente en `04-backend/` | Request/response bodies, validaciones Pydantic |
| `backend/requirements.txt` | `01-introduccion/stack.md` | Versiones de librerías, nuevas dependencias |
| `frontend/src/api.js` | `05-frontend/api-js.md` | Funciones fetch, interceptores, manejo errores |
| `frontend/src/pages/*.jsx` | `05-frontend/paginas.md` | Páginas, guards de autenticación, flujo |
| `frontend/src/components/*.jsx` | `05-frontend/componentes.md` | Componentes UI, props, comportamiento |
| `frontend/src/hooks/*.js` | `05-frontend/hooks.md` | Custom hooks, dependencias, estado |
| `frontend/src/services/*.js` | `05-frontend/servicios-frontend.md` | Servicios de API, transformación datos |
| `docker-compose.yml` | `06-devops/docker.md`, `06-devops/README.md` | Servicios, volúmenes, variables env |
| `.env.example` | `06-devops/env-vars.md` | Nueva variable, descripción, valor por defecto |
| `nginx.conf` | `06-devops/nginx.md` | Configuración proxy, timeouts, rutas |

---

## Paso 3 — Reglas estrictas de actualización

Antes de escribir cualquier archivo, lee tanto el archivo fuente modificado como el archivo `.md` de destino. Aplica estas reglas sin excepción:

### 3.1 Verdad del código — regla suprema

- La fuente de verdad es **el código Python/JSX/JS**, no la documentación anterior.
- Si la doc dice algo que contradice el código, el código gana.
- Si el código tiene una convención (ej. `shopping_list`, `meal_plan`), documéntala exactamente como aparece.
- Nombres de campos en BD: documentar con el nombre exacto de la columna SQLAlchemy.
- Endpoints: documentar con las rutas exactas definidas en los decoradores FastAPI.

### 3.2 Preservar estilo visual

- **No añadir emojis** — documentación profesional sin emojis.
- Mantener callouts con sintaxis Docsify: `> [!NOTE]`, `> [!WARNING]`, `> [!DANGER]`, `> [!TIP]`.
- Mantener tablas con formato `| col | col |` alineadas y con separador de encabezado.
- Mantener el aspecto visual consistent con el resto de `/doc`.

### 3.3 Diagramas Mermaid — actualización cuidadosa

Para cada diagrama Mermaid que necesite actualizar:

1. Lee el bloque completo ` ```mermaid ``` ` del archivo `.md` de destino.
2. Identifica exactamente qué nodos, relaciones o actores cambian.
3. Reescribe el bloque completo con los cambios integrados.
4. Valida la sintaxis mentalmente:
   - `erDiagram`: usa `||--o{` para uno-a-muchos, `}o--o{` para muchos-a-muchos.
   - `sequenceDiagram`: usa `participant`, `activate`/`deactivate`, `Note over`, `alt`/`else`/`end`.
   - `flowchart TD/LR`: usa `[texto]` para procesos, `{decisión}` para rombos, `([redondo])` para terminales.
5. **No dejes diagramas con sintaxis rota** — es preferible simplificar que romper.

### 3.4 Actualización de tablas de campos (modelos DB)

Cuando cambia un modelo SQLAlchemy:
- Lee el modelo Python (columnas, tipos, `nullable`, `unique`, `default`, `ForeignKey`).
- Actualiza la tabla de campos en la doc con el mismo orden que aparece en el modelo.
- Documenta constraints importantes (`unique`, `nullable=False`).
- Si hay un campo `computed` (property de Python), indica `— calculado` en la columna Tipo.
- Refleja los cambios también en el diagrama ER de `03-base-datos/README.md`.

**Tabla estándar de campos:**

| Campo | Tipo | Nullable | Unique | Descripción |
|-------|------|----------|--------|-------------|
| `id` | INTEGER | No | Sí (PK) | Identificador único |
| `name` | VARCHAR(100) | No | No | Nombre del recurso |
| `created_at` | TIMESTAMP | No | No | Fecha de creación (auto) |

### 3.5 Actualización de endpoints

Cuando cambia un router FastAPI:
- Lee los decoradores `@router.get/post/put/delete` y sus `response_model`.
- Actualiza la tabla de endpoints (Método, Ruta, Auth, Descripción).
- Actualiza ejemplos de request/response si los schemas Pydantic cambiaron.
- Si se añade un nuevo router, añádelo también a `04-backend/README.md` (tabla de routers).

**Tabla estándar de endpoints:**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/recipes` | user, admin | Listar recetas con filtros |
| POST | `/api/v1/recipes` | user, admin | Crear nueva receta |
| DELETE | `/api/v1/recipes/{id}` | user/owner, admin | Eliminar receta |

### 3.6 Variables de entorno

Cuando cambia `config.py`:
- Añade/elimina/actualiza filas en la tabla de `06-devops/env-vars.md`.
- Documenta el valor por defecto exacto y si es obligatoria o con fallback.
- Si es un secreto (password, API key, token), indica: "Ver `.env.example` — nunca en código".

**Tabla estándar de env vars:**

| Variable | Obligatoria | Valor por defecto | Descripción |
|----------|-------------|-------------------|-------------|
| `DATABASE_URL` | Sí | — | URL conexión BD (postgresql://...) |
| `SECRET_KEY` | Sí | — | Clave para JWT, generar con `openssl` |
| `DEBUG` | No | `False` | Modo desarrollo (nunca `True` en prod) |

### 3.7 Actualización de servicios

Cuando cambias un servicio en `backend/app/services/`:
- Documenta las funciones principales (qué hace, parámetros, retorno).
- Explica la lógica crítica (ej. deduplicación de ingredientes en shopping).
- Incluye pseudocódigo si la lógica es compleja.
- Menciona dependencias de otros servicios o BD.

---

## Paso 4 — Validación antes de guardar

Antes de escribir cada archivo `.md` modificado, comprueba mentalmente:

- [ ] ¿El diagrama Mermaid tiene sintaxis válida (paréntesis cerrados, palabras clave correctas)?
- [ ] ¿Los nombres de campos/endpoints/funciones coinciden exactamente con el código (case-sensitive)?
- [ ] ¿Las tablas Markdown están alineadas y tienen encabezado + separador `|---|`?
- [ ] ¿No se ha añadido ningún emoji?
- [ ] ¿Los callouts `> [!NOTE]` tienen formato exacto de Docsify?
- [ ] ¿El archivo `.md` conserva sus secciones originales (solo se modifica lo necesario)?
- [ ] ¿Se ha preservado la numeración de secciones (`## 1.`, `## 2.`) si existía?
- [ ] ¿Los ejemplos de código (Python, JSX) coinciden con el código real?

---

## Paso 5 — Output: tabla resumen CLI

Al terminar todas las modificaciones, imprime **solo** esta tabla y nada más:

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  /recetaria-update-doc — Resumen de actualización                               ║
╠══════════════════════════════════════════════╦══════════════════════════════════╣
║  Archivo /doc modificado                     ║  Razón del cambio                ║
╠══════════════════════════════════════════════╬══════════════════════════════════╣
║  03-base-datos/esquema.md                    ║  Nuevo campo `total_quantity`    ║
║                                              ║  en ShoppingItem                 ║
╠══════════════════════════════════════════════╬══════════════════════════════════╣
║  04-backend/shopping-api.md                  ║  Endpoint POST /shopping/generate║
║                                              ║  actualizado con nuevo schema    ║
╠══════════════════════════════════════════════╬══════════════════════════════════╣
║  04-backend/servicios.md                     ║  Nueva función                   ║
║                                              ║  deduplicate_and_merge_ingredients
╚══════════════════════════════════════════════╩══════════════════════════════════╝

  Archivos analizados : XX   Modificados : YY   Sin impacto doc : ZZ
```

Reemplaza los valores de ejemplo con los archivos reales modificados. Si un cambio afecta una sección que **no existe**, añade `[NUEVO]` al inicio del nombre de archivo.

---

## Referencia rápida — Estructura de /doc para RecetarIA

```
doc/
├── 01-introduccion/
│   ├── README.md           vision, roadmap
│   └── stack.md            tecnologías, versiones
├── 02-arquitectura/
│   ├── README.md           overview
│   ├── flujos.md           diagramas de flujos principales
│   ├── autenticacion.md    JWT, roles, guards
│   └── errores.md          excepciones, códigos HTTP
├── 03-base-datos/
│   ├── README.md           diagrama ER, overview
│   ├── esquema.md          modelos, campos, relaciones
│   └── migraciones.md      histórico de cambios
├── 04-backend/
│   ├── README.md           routers, servicios overview
│   ├── auth.md             endpoints /auth
│   ├── recipes-api.md      endpoints /recipes
│   ├── shopping-api.md     endpoints /shopping
│   ├── meal-plan-api.md    endpoints /meal-plan
│   ├── admin-api.md        endpoints /admin
│   └── servicios.md        lógica de negocio
├── 05-frontend/
│   ├── README.md           overview, estructura
│   ├── paginas.md          páginas React, rutas
│   ├── componentes.md      componentes reutilizables
│   ├── hooks.md            custom hooks
│   ├── servicios-frontend.md API calls, transformación
│   └── api-js.md           cliente HTTP, interceptores
├── 06-devops/
│   ├── README.md           overview
│   ├── docker.md           docker-compose, contenedores
│   ├── env-vars.md         variables de entorno
│   ├── nginx.md            reverse proxy
│   └── deploy.md           Vercel (frontend), Render (backend)
└── 07-guias/
    ├── nueva-funcionalidad.md     paso a paso para agregar feature
    ├── nueva-migracion.md         cómo crear migraciones
    ├── testing.md                 escribir tests
    └── contribucion.md            convenciones, PR workflow
```

---

## Casos especiales para RecetarIA

### Nuevo modelo de base de datos (sin doc previa)

Si el diff incluye un modelo completamente nuevo sin entrada en `/doc`:
1. Determina si es un modelo principal (receta, usuario) o secundario (favorito, comentario).
2. Añade una nueva sección en `03-base-datos/esquema.md` con la tabla de campos.
3. Actualiza el diagrama ER en `03-base-datos/README.md`.
4. Anota como `[NUEVO]` en la tabla resumen.

**Ejemplo:**
```markdown
## Modelo: CommentRecipe

| Campo | Tipo | Nullable | Unique | Descripción |
|-------|------|----------|--------|-------------|
| id | INTEGER | No | Sí (PK) | Identificador único |
| recipe_id | INTEGER FK | No | No | Referencia a Recipe |
| user_id | INTEGER FK | No | No | Referencia a User |
| text | TEXT | No | No | Contenido del comentario |
| created_at | TIMESTAMP | No | No | Fecha de creación |
| updated_at | TIMESTAMP | No | No | Fecha de actualización |
```

### Nuevo endpoint en router existente

Si solo se añade un endpoint:
1. Añade fila a la tabla de endpoints en el archivo `.md` correspondiente.
2. Incluye ejemplo de request/response si es complejo.
3. Documenta parámetros opcionales, filtros, validaciones.

### Nuevo componente React

Si se crea un componente nueva:
1. Añade sección en `05-frontend/componentes.md`.
2. Documenta props, comportamiento, hooks utilizados.
3. Incluye ejemplo de uso si es reutilizable.

### Cambio en schema Pydantic

Cuando cambia un schema (nuevo campo, validación):
1. Actualiza el endpoint correspondiente en `04-backend/`.
2. Actualiza ejemplo de request/response.
3. Documenta cambios de validación (ej. `min_length`, `regex`).

### Nueva variable de entorno

Cuando se agrega a `config.py`:
1. Añade fila a tabla en `06-devops/env-vars.md`.
2. Indica si es obligatoria o tiene valor por defecto.
3. Si es secreto, documenta cómo generar/obtener.

---

## Checklist final

Antes de dar por completado `/recetaria-update-doc`:

- [ ] ¿Todos los cambios de código se reflejan en `/doc`?
- [ ] ¿Los nombres son case-sensitive exactos?
- [ ] ¿Las tablas están alineadas correctamente?
- [ ] ¿Los diagramas Mermaid tienen sintaxis válida?
- [ ] ¿No se añadieron emojis?
- [ ] ¿Se preservó la estructura de los archivos?
- [ ] ¿Se actualizo `.md` relacionado (ej. README.md si se añadió endpoint)?
- [ ] ¿La tabla resumen es concisa y precisa?

---

## Notas importantes

- **Mantén la coherencia**: Si una funcionalidad afecta múltiples archivos de `/doc`, actualízalos todos.
- **Mantén la claridad**: Los comentarios en `/doc` deben ser comprensibles para un nuevo developer.
- **Sincronización es deuda técnica**: Si `/doc` no se actualiza al cambiar código, se convierte en deuda técnica.
- **Revisa antes de hacer commit**: Verifica que `/doc` y código estén sincronizados en cada PR.
