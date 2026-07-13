---
name: recetaria-clean-code
description: Use when reviewing or writing code for RecetarIA. Apply to service functions, routers, React components, tests. Use for functions >20 lines, unclear naming, error handling in FastAPI, complex components, or before PR review. Specific to the RecetarIA stack (FastAPI + SQLAlchemy + React).
---

# Clean Code Principles para RecetarIA

## Overview

**Código limpio = fácil de mantener, testear y extender.**

RecetarIA es un proyecto pequeño (2-3 usuarios), pero el código debe ser profesional. Servicios claros, componentes reutilizables, error handling deliberado.

---

## Part I: Naming en RecetarIA

### Backend (Python/FastAPI)

```python
# ❌ BAD: Nombres vagos
def process_data(data):
    items = []
    for d in data:
        if check(d):
            items.append(calc(d))
    return items

# ✅ GOOD: Nombres que revelan intención
def generate_shopping_list(selected_recipes: list[int]) -> list[ShoppingItem]:
    deduplicated_items = []
    for recipe_id in selected_recipes:
        items = get_recipe_ingredients(recipe_id)
        deduplicated_items = merge_and_deduplicate(deduplicated_items, items)
    return deduplicated_items
```

### Frontend (React/JavaScript)

```javascript
// ❌ BAD: Nombres poco claros
function List({ data }) {
  const [state, setState] = useState([]);
  const handle = async (item) => {
    const result = await api(item);
    setState(result);
  };
  return <div>{state.map(s => <div>{s}</div>)}</div>;
}

// ✅ GOOD: Nombres específicos
function RecipeListPage() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserRecipes = async () => {
    setIsLoading(true);
    const userRecipes = await recipeService.getUserRecipes();
    setRecipes(userRecipes);
    setIsLoading(false);
  };

  return (
    <div>
      {isLoading ? <Spinner /> : <RecipeCardGrid recipes={recipes} />}
    </div>
  );
}
```

### Convenciones específicas de RecetarIA

| Contexto | Patrón | Ejemplo |
|----------|--------|---------|
| Service methods | `verb_noun` | `generate_shopping_list`, `validate_recipe`, `calculate_meal_totals` |
| Boolean methods | `is_*`, `has_*`, `can_*` | `is_ingredient_available`, `has_user_permission`, `can_edit_recipe` |
| React components | `PascalCase` + `Page` para páginas | `RecipeDetailPage`, `ShoppingListCard`, `MealPlanDay` |
| React hooks | `use_*` | `useAuth`, `useRecipes`, `useShopping`, `useMealPlan` |
| DB models | PascalCase | `Recipe`, `User`, `ShoppingItem`, `MealPlan` |
| DB columns | snake_case | `created_at`, `user_id`, `recipe_id` |

---

## Part II: Función pequeña y enfocada (SRP)

### Ejemplo: Shopping Service

```python
# ❌ BAD: Una función gigante hace TODO
def generate_shopping_list(recipe_ids: list[int], user_id: int, db: Session):
    # Valida recetas (5 líneas)
    recipes = db.query(Recipe).filter(Recipe.id.in_(recipe_ids)).all()
    if not recipes:
        raise ValueError("No recipes found")
    
    # Obtiene ingredientes (10 líneas)
    items_dict = {}
    for recipe in recipes:
        for ri in recipe.recipe_ingredients:
            key = (ri.ingredient.name.lower(), ri.unit.lower())
            if key in items_dict:
                # Suma cantidades
                try:
                    current = float(items_dict[key]['quantity'])
                    new = float(ri.quantity)
                    items_dict[key]['quantity'] = str(current + new)
                except ValueError:
                    items_dict[key]['quantity'] += f" + {ri.quantity}"
            else:
                items_dict[key] = {'name': ri.ingredient.name, 'quantity': ri.quantity, 'unit': ri.unit}
    
    # Guarda en BD (8 líneas)
    for key, item in items_dict.items():
        shopping_item = ShoppingItem(
            user_id=user_id,
            ingredient_name=item['name'],
            total_quantity=item['quantity'],
            unit=item['unit']
        )
        db.add(shopping_item)
    db.commit()
    
    return items_dict

# ✅ GOOD: Funciones pequeñas, cada una hace una cosa
def generate_shopping_list(recipe_ids: list[int], user_id: int, db: Session) -> list[ShoppingItem]:
    """Orchestrate shopping list generation."""
    recipes = get_recipes_by_ids(recipe_ids, db)
    validate_recipes_exist(recipes, recipe_ids)
    
    raw_ingredients = extract_ingredients_from_recipes(recipes)
    deduplicated_items = deduplicate_and_merge_ingredients(raw_ingredients)
    
    shopping_items = save_shopping_items(deduplicated_items, user_id, db)
    return shopping_items

def validate_recipes_exist(recipes: list[Recipe], requested_ids: list[int]):
    """Ensure all requested recipes were found."""
    found_ids = {r.id for r in recipes}
    missing_ids = set(requested_ids) - found_ids
    if missing_ids:
        raise RecipeNotFoundError(f"Recipes not found: {missing_ids}")

def extract_ingredients_from_recipes(recipes: list[Recipe]) -> dict:
    """Convert recipes into flat ingredient dictionary."""
    ingredients = {}
    for recipe in recipes:
        for recipe_ingredient in recipe.recipe_ingredients:
            key = normalize_ingredient_key(
                recipe_ingredient.ingredient.name,
                recipe_ingredient.unit
            )
            ingredients[key] = recipe_ingredient
    return ingredients

def deduplicate_and_merge_ingredients(raw_ingredients: dict) -> list[ShoppingItem]:
    """Combine and sum duplicate ingredients."""
    merged = {}
    for key, ingredient in raw_ingredients.items():
        if key not in merged:
            merged[key] = ShoppingItem(
                ingredient_name=ingredient.ingredient.name,
                quantity=ingredient.quantity,
                unit=ingredient.unit
            )
        else:
            merged[key].quantity = sum_quantities(
                merged[key].quantity,
                ingredient.quantity
            )
    return list(merged.values())

def sum_quantities(existing: str, new: str) -> str:
    """Try numeric sum, fallback to concatenation."""
    try:
        return str(float(existing) + float(new))
    except ValueError:
        return f"{existing} + {new}"

def save_shopping_items(items: list[ShoppingItem], user_id: int, db: Session):
    """Persist shopping items to database."""
    for item in items:
        item.user_id = user_id
        db.add(item)
    db.commit()
    return items
```

**Ventajas:**
- Cada función hace UNA cosa
- Fácil de testear individualmente
- Reutilizable en otros contextos
- Claro dónde está cada responsabilidad

---

## Part III: SOLID en RecetarIA

### S - Single Responsibility

```python
# ❌ BAD: RecipeService hace todo
class RecipeService:
    def create_recipe(self, data): ...         # Creación
    def send_notification(self, recipe): ...   # Notificaciones
    def generate_pdf(self, recipe): ...        # PDF
    def cache_recipe(self, recipe): ...        # Caché

# ✅ GOOD: Responsabilidades separadas
class RecipeService:
    """Only handles recipe business logic."""
    def create_recipe(self, data: RecipeCreate, db: Session) -> Recipe: ...
    def get_recipe(self, recipe_id: int, db: Session) -> Recipe: ...
    def update_recipe(self, recipe_id: int, data: RecipeUpdate, db: Session) -> Recipe: ...

class RecipeNotificationService:
    """Handles recipe-related notifications."""
    def notify_recipe_created(self, recipe: Recipe) -> None: ...

class RecipeExportService:
    """Handles recipe exports (PDF, etc)."""
    def export_recipe_as_pdf(self, recipe: Recipe) -> bytes: ...
```

### O - Open/Closed

```python
# ❌ BAD: Cada filtro requiere modificar la función
def get_recipes(db: Session, name=None, category=None, difficulty=None):
    query = db.query(Recipe)
    if name:
        query = query.filter(Recipe.title.contains(name))
    if category:
        query = query.filter(Recipe.category_id == category)
    if difficulty:
        query = query.filter(Recipe.difficulty == difficulty)
    # Próxima vez: agregar 10 líneas más...
    return query.all()

# ✅ GOOD: Extensible via filters
class RecipeFilter:
    """Base class for recipe filters."""
    def apply(self, query: Query) -> Query:
        raise NotImplementedError

class RecipeNameFilter(RecipeFilter):
    def __init__(self, name: str):
        self.name = name
    
    def apply(self, query: Query) -> Query:
        return query.filter(Recipe.title.contains(self.name))

class RecipeCategoryFilter(RecipeFilter):
    def __init__(self, category_id: int):
        self.category_id = category_id
    
    def apply(self, query: Query) -> Query:
        return query.filter(Recipe.category_id == self.category_id)

def get_recipes(db: Session, filters: list[RecipeFilter]) -> list[Recipe]:
    """Apply filters and return recipes."""
    query = db.query(Recipe)
    for filter_obj in filters:
        query = filter_obj.apply(query)
    return query.all()

# Uso: add new filters sin tocar get_recipes()
```

### I - Interface Segregation (Python: Protocols)

```python
# ❌ BAD: Interface gordo
class RecipeService:
    def create_recipe(self): ...
    def delete_recipe(self): ...
    def get_recipe_ingredients(self): ...
    def send_email_notification(self): ...
    def generate_pdf_report(self): ...

# Cliente solo necesita crear, pero recibe 5 métodos innecesarios

# ✅ GOOD: Interfaces específicas
from typing import Protocol

class Creatable(Protocol):
    def create_recipe(self, data): ...

class Deletable(Protocol):
    def delete_recipe(self, id): ...

class NotificationService(Protocol):
    def send_email_notification(self, user): ...

class RecipeService:
    """Only implements what it needs."""
    def create_recipe(self, data): ...
    def delete_recipe(self, id): ...

class EmailService:
    def send_email_notification(self, user): ...
```

---

## Part IV: Code Smells en RecetarIA

### Long Method en Router

```python
# ❌ BAD: Router hace demasiado
@router.post("/recipes")
async def create_recipe(
    recipe_data: RecipeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validar (10 líneas)
    if not recipe_data.title:
        raise ValueError("Title required")
    if len(recipe_data.ingredients) == 0:
        raise ValueError("Need ingredients")
    
    # Procesar ingredientes (15 líneas)
    ingredients = []
    for ing in recipe_data.ingredients:
        normalized_name = ing.name.strip().lower()
        db_ingredient = db.query(Ingredient).filter_by(name=normalized_name).first()
        if not db_ingredient:
            db_ingredient = Ingredient(name=normalized_name)
            db.add(db_ingredient)
        ingredients.append(db_ingredient)
    db.commit()
    
    # Crear receta (10 líneas)
    recipe = Recipe(
        title=recipe_data.title,
        description=recipe_data.description,
        user_id=current_user.id,
        category_id=recipe_data.category_id
    )
    db.add(recipe)
    
    # Asociar ingredientes (5 líneas)
    for ingredient in ingredients:
        ri = RecipeIngredient(
            recipe=recipe,
            ingredient=ingredient,
            quantity=recipe_data.ingredients[ingredients.index(ingredient)].quantity
        )
        db.add(ri)
    db.commit()
    
    return RecipeResponse.from_orm(recipe)

# ✅ GOOD: Router delega a services
@router.post("/recipes", response_model=RecipeResponse)
async def create_recipe(
    recipe_data: RecipeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new recipe for authenticated user."""
    recipe = recipe_service.create_recipe(
        recipe_data=recipe_data,
        user_id=current_user.id,
        db=db
    )
    return recipe

# services/recipe_service.py
def create_recipe(
    recipe_data: RecipeCreate,
    user_id: int,
    db: Session
) -> Recipe:
    """Create recipe with ingredients."""
    validate_recipe_data(recipe_data)
    
    ingredients = process_ingredients(recipe_data.ingredients, db)
    
    recipe = Recipe(
        title=recipe_data.title,
        description=recipe_data.description,
        user_id=user_id,
        category_id=recipe_data.category_id
    )
    
    associate_ingredients(recipe, ingredients, recipe_data.ingredients, db)
    db.add(recipe)
    db.commit()
    
    return recipe
```

### Feature Envy en React

```javascript
// ❌ BAD: Component envía mucha lógica de shoppingService
function ShoppingListPage() {
  const [recipes, setRecipes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);

  const generateList = async () => {
    // Lógica de shopping aquí (debería estar en hook)
    const items = {};
    for (const recipe of recipes.filter(r => selectedIds.includes(r.id))) {
      for (const ing of recipe.ingredients) {
        const key = `${ing.name}-${ing.unit}`;
        if (key in items) {
          items[key].quantity += ing.quantity;
        } else {
          items[key] = ing;
        }
      }
    }
    setShoppingItems(Object.values(items));
  };

  return <div>...</div>;
}

// ✅ GOOD: Hook encapsula lógica
function useShopping() {
  const [shoppingItems, setShoppingItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateList = async (selectedRecipeIds) => {
    setIsLoading(true);
    try {
      const items = await shoppingService.generateList(selectedRecipeIds);
      setShoppingItems(items);
    } catch (error) {
      console.error('Failed to generate list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { shoppingItems, generateList, isLoading };
}

function ShoppingListPage() {
  const { shoppingItems, generateList, isLoading } = useShopping();
  const recipes = useRecipes();

  const handleGenerate = () => {
    const selectedIds = recipes
      .filter(r => r.isSelected)
      .map(r => r.id);
    generateList(selectedIds);
  };

  return (
    <div>
      {isLoading ? <Spinner /> : <ShoppingList items={shoppingItems} />}
    </div>
  );
}
```

---

## Part V: Error Handling en RecetarIA

### Backend (FastAPI)

```python
# ❌ BAD: Error swallowing
@router.post("/recipes")
async def create_recipe(recipe_data: RecipeCreate, db: Session):
    try:
        recipe = recipe_service.create_recipe(recipe_data, db)
        return recipe
    except Exception as e:
        print(e)  # Error desaparece
        return {"error": "Failed"}

# ✅ GOOD: Manejo específico y propagación clara
class RecipeValidationError(Exception):
    """Recipe data is invalid."""
    pass

class RecipeNotFoundError(Exception):
    """Recipe does not exist."""
    pass

@router.post("/recipes", response_model=RecipeResponse, status_code=201)
async def create_recipe(
    recipe_data: RecipeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new recipe."""
    try:
        recipe = recipe_service.create_recipe(
            recipe_data=recipe_data,
            user_id=current_user.id,
            db=db
        )
        return recipe
    except RecipeValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error creating recipe: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

def validate_recipe_data(recipe_data: RecipeCreate):
    """Validate recipe before processing."""
    if not recipe_data.title or not recipe_data.title.strip():
        raise RecipeValidationError("Title is required")
    if len(recipe_data.ingredients) == 0:
        raise RecipeValidationError("Recipe must have at least one ingredient")
    if recipe_data.time_min <= 0:
        raise RecipeValidationError("Time must be positive")
```

### Frontend (React)

```javascript
// ❌ BAD: Error swallowing
async function fetchRecipes() {
  try {
    const data = await api.get('/recipes');
    setRecipes(data);
  } catch (error) {
    console.log(error);  // Error silenciado
  }
}

// ✅ GOOD: Manejo específico
async function fetchRecipes() {
  setIsLoading(true);
  try {
    const data = await api.get('/recipes');
    setRecipes(data);
    setError(null);
  } catch (error) {
    if (error.status === 401) {
      // Usuario no autenticado
      redirectToLogin();
    } else if (error.status === 500) {
      // Error del servidor
      setError('Server error. Please try again later.');
    } else {
      // Error desconocido
      setError('Failed to load recipes');
      logger.error('Fetch recipes error:', error);
    }
  } finally {
    setIsLoading(false);
  }
}
```

---

## Part VI: Comentarios en RecetarIA

```python
# ❌ BAD: Comentario explicar QUÉ (redundante)
def calculate_total(items):
    # Loop through items and add their prices
    total = 0
    for item in items:
        total += item.price * item.quantity
    return total

# ❌ BAD: Código compensando mal naming
def gsl(ids: list, uid: int, db):  # "generate shopping list"?
    # ...

# ✅ GOOD: Código auto-documenta, comentario explica POR QUÉ
def calculate_order_total(items: list[OrderItem]) -> Decimal:
    """Calculate total price of order items."""
    return sum(item.price * item.quantity for item in items)

# ✅ GOOD: Comentario explica decisión de negocio
# NOTE: VAT applied at checkout, not here (per Finance requirement FR-2341)
# This ensures users see pre-VAT totals until final confirmation
subtotal = calculate_order_total(items)

# ✅ GOOD: Comentario advierte de comportamiento no-obvious
# Using insertion sort because shopping lists are typically <50 items
# Insertion sort outperforms quicksort for small n (measured: ~2x faster)
sorted_items = insertion_sort(shopping_items)
```

---

## Part VII: Quick Ref para RecetarIA

| Síntoma | Problema | Fix |
|---------|----------|-----|
| Router >30 líneas | Lógica en router en lugar de service | Extraer a `*_service.py` |
| `data`, `items`, `result` en service | Nombres vagos | Usar `recipes`, `shopping_items`, `deduplicated_ingredients` |
| `try/except` vacío | Error swallowing | Manejar específicamente o re-throw |
| Component >300 líneas | God component | Dividir en sub-componentes + hooks |
| Ingrediente sin normalizar | Duplicados en BD | Siempre: `name.strip().lower()` |
| Función con 6+ parámetros | Too many inputs | Usar dataclass o Pydantic model |
| Nesting >3 niveles | Condiciones complejas | Early return, extract function |
| Componente renderiza lógica business | Feature envy | Mover a hook o service |

---

## Severity Guide para RecetarIA

| Nivel | Indicadores | Acción |
|-------|------------|--------|
| CRÍTICO | Error swallowing, DB duplicados por no normalizar, lógica en router | Fix antes de merge |
| ALTO | Service >50 líneas, component >300 líneas, feature envy claro | Should fix |
| MEDIO | Route >30 líneas, nombres poco claros, >4 parámetros | Consider fixing |
| BAJO | Style, documentación, refactorings menores | Optional |

---

## Red Flags - Stop and Refactor

| Estás a punto de... | Pregúntate... |
|-------------------|---------------|
| Agregar 31ª línea a function | Should extract a smaller function? |
| Usar `data` o `result` como nombre | What does this actually represent? |
| Escribir `except: pass` | Should I handle this error? |
| Crear component >300 líneas | Should I break this into smaller components? |
| Normalizar ingrediente en 3 lugares | Should I extract to `normalize_ingredient()`? |
| Duplicar lógica de filtrado | Should I create a reusable filter service? |
| Pasar 5+ parámetros a función | Should I use a DTO or config object? |

---

## Checklist Pre-PR para RecetarIA

- [ ] ¿Cada función hace una cosa?
- [ ] ¿Nombres revelan intención?
- [ ] ¿Hay error handling específico (no generic)?
- [ ] ¿Router delega a service?
- [ ] ¿Component es testeable?
- [ ] ¿Hay duplicación de código?
- [ ] ¿Comentarios explican POR QUÉ, no QUÉ?
- [ ] ¿Ingredientes normalizados antes de guardar?
- [ ] ¿Validación clara en inputs?
