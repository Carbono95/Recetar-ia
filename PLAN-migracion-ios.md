# RecetarIA — Plan de migración a iOS (v2, optimizado)

**Fecha:** julio 2026
**Autor:** Análisis generado con Claude Code, a partir de `CLAUDE.md` y el código en `frontend/src/`.
**Estado:** revisión v2. Reestructura el plan v1 alrededor de un principio de eficiencia (**compartir, no copiar**) y de slices verticales, para eliminar trabajo duplicado y descubrir riesgo antes. El fondo de la recomendación (React Native + Expo, desarrollable 100% en Windows sin Mac) no cambia.

---

## 0. Qué cambia respecto al plan v1 (y por qué es más eficiente)

| Cambio | Plan v1 | Plan v2 | Por qué ahorra trabajo |
|---|---|---|---|
| **Capa de datos** | Se **copia** `services/`+`hooks/` a un proyecto Expo nuevo | Se **extrae** a `packages/core` en un monorepo, y la web actual y el móvil la **comparten** | Con la copia, cada bug y cada feature futura se hacen **dos veces**. Con el core compartido, la lógica de negocio (el ~90% reutilizable) tiene **una sola fuente de verdad**: se escribe una vez. Neutraliza el riesgo nº3 de la tabla de riesgos del propio plan. |
| **Orden de trabajo** | Horizontal: Fase 1 datos sin UI → Fase 2 pantallas vacías → Fase 3 UI | Vertical: primer hito = **login E2E en el iPhone** | El andamiaje vacío es movimiento tirado. Un slice vertical valida **todo el stack** (core, secure-store, red/CORS, guard, una pantalla real) en la semana 1. Si algo del stack está roto, se sabe pronto, no tras semanas de scaffolding. |
| **Pantallas** | Se estilan una a una desde cero | **Kit de primitivas** (`<Screen>/<Button>/<Card>/<Input>`) con los tokens de `tailwind.config.js`, primero; luego las pantallas son composición | Estilar 6 pantallas desde cero repite trabajo y produce inconsistencia. Con el kit, cada pantalla se ensambla. Encoge la fase más larga. |
| **Lenguaje** | Ambiguo (ejemplo en `.tsx`, código actual en `.jsx`) | **JavaScript**, explícito | Añadir TypeScript sería una migración dentro de la migración. Se mantiene el stack que ya se domina. |
| **CORS en dev** | "Reutiliza el mecanismo existente" (impreciso) | Prerrequisito concreto: arreglar `main.py:20-21` (ver §7) | En `debug`, los orígenes están hardcodeados a `localhost:5173` y el móvil no llega al backend. Sin el arreglo, la Fase 0 se bloquea. |

**Resultado:** el tiempo total ronda **6.5-8.5 semanas a $0** (con la vía `ios-builder`+MobAI de la Fase 5A), con mucho menos trabajo desechable *ahora* y, sobre todo, con un core compartido que **reduce a la mitad todo el mantenimiento futuro** de la lógica de negocio.

---

## 1. Resumen ejecutivo

Se recomienda **React Native + Expo** para la app, y **`ios-builder` + MobAI como vía elegida de build y distribución** ($0, con ícono propio, sin Mac). Es la única combinación 100% ejecutable en Windows que además da una app instalada de verdad sin pagar los $99/año.

- **Vía elegida (§5 Fase 5A):** `ios-builder` compila el `.ipa` en **GitHub Actions (runners macOS en la nube)** y **MobAI** lo firma/instala en el iPhone con un **Apple ID gratuito**. Da ícono propio a **$0 y sin Mac**. Matices heredados del Apple ID gratuito: re-firma periódica (~7 días, *verificar*) y **sin push nativo**; además depende de una herramienta joven de terceros — por eso se **valida en un spike (Fase 0)** antes de confiar en ella.
- **Durante el desarrollo:** **Expo Go** ($0, sin Mac) para el ciclo diario de código→iPhone con hot-reload. No da ícono propio, pero es lo más cómodo para iterar y para que varias personas prueben.
- **Fallback estable (§5 Fase 5B):** si MobAI no convence o se quiere push y perfiles de ~1 año, **Ad Hoc con Apple Developer Program ($99/año)** — app privada real en dispositivos registrados, **sin App Store ni revisión**. EAS Build o el propio `ios-builder` generan el `.ipa` sin Mac; los $99 pagan la firma, no la publicación.
- **SwiftUI** queda descartado de raíz: no hay Xcode/macOS disponible.
- **La PWA ya existe** (Fase 6 del proyecto) y cuesta $0, pero en la UE, desde marzo 2024 (cumplimiento DMA), Apple abre las PWA dentro de Safari en vez de en modo standalone, lo que anula push y la sensación de "app instalada". Sirve como complemento web, no como la app iOS objetivo. *(Estado cambiante: reverificar al implementar.)*

La diferencia clave de esta v2 es **arquitectónica**: en vez de un frontend móvil que copia y luego diverge de la web, se monta un monorepo con un **core compartido** — la web y el móvil consumen la misma capa de datos.

---

## 2. Principio rector: compartir, no copiar

### Estructura objetivo (monorepo ligero con `npm workspaces`)

```
recetaria/
├── packages/
│   └── core/                 ← services/ + hooks/ + lógica de dominio (agnóstico de plataforma)
│       ├── services/         (api, auth, recipe, shopping, mealPlan)
│       ├── hooks/            (useAuth, useRecipes, useShopping, useMealPlan)
│       └── index.js
├── frontend/                 ← web actual (React DOM + Vite) — importa @recetaria/core
├── mobile/                   ← nuevo (Expo) — importa @recetaria/core
└── backend/                  ← FastAPI, sin cambios
```

`npm workspaces` viene incluido en npm (ya se usa en el proyecto), sin herramientas pesadas tipo Nx/Turborepo — proporcional a un proyecto de un solo dev.

### El único obstáculo real: 3 dependencias de plataforma en `api.js`

`services/api.js` usa tres cosas que difieren entre web y móvil:

1. **`localStorage`** (tokens) → web: `localStorage`; móvil: `expo-secure-store` (cifrado, apropiado para JWT).
2. **URL base de la API** → web: `import.meta.env.VITE_API_URL`; móvil: `expo-constants` (+ IP LAN en dev).
3. **`uploadFile` con `FormData`** → web: objeto `File`; móvil: `{ uri, name, type }`.

**Solución:** inyección por adaptador. `packages/core` expone `createApiClient({ storage, apiUrl })`; cada plataforma pasa su adaptador. Es un refactor **pequeño** de la web actual que, además, la deja más limpia y testeable — trabajo reutilizable para siempre, no un peaje.

```js
// packages/core — createApiClient recibe sus dependencias de plataforma
export function createApiClient({ storage, apiUrl }) { /* fetch + Bearer + manejo 401 */ }

// frontend/  → storage = adaptador sobre localStorage
// mobile/     → storage = adaptador sobre expo-secure-store
```

Los `window.alert` (2 en `hooks/`: `useRecipes.js:46`, `useShopping.js:47`) se abstraen tras un pequeño `notify()` inyectable, o se dejan en la capa de UI de cada plataforma (web: `alert`; móvil: `Alert.alert`). No pertenecen al core.

---

## 3. Reutilización del código actual

Inspección de `frontend/src/` (React 18 + Vite + Tailwind; estado con hooks + Context, sin Redux).

| Carpeta / archivo | En el core compartido | Notas |
|---|---|---|
| `services/api.js` | **Sí**, tras el refactor de adaptador (§2) | Una implementación, dos adaptadores de plataforma |
| `services/{auth,recipe,shopping,mealPlan}Service.js` | **Sí**, casi intactos | Dependen de `api.js` |
| `hooks/{useAuth,useRecipes,useShopping,useMealPlan}.js` | **Sí** | `window.alert` → `notify()` inyectable |
| `context/AuthContext.jsx` | **Parcial** | El patrón Context va al core; `localStorage` → adaptador de storage |
| `tailwind.config.js` (tokens de "Claude Design") | **Valores reutilizables** | Los hex/radios/sombras se copian tal cual a la config de **NativeWind**; la sintaxis de clases es casi idéntica |
| `components/*.jsx`, `pages/*.jsx`, `forms/RecipeForm.jsx` | **No el JSX** (RN no renderiza HTML/CSS) | La **lógica interna** (qué estado, qué valida, en qué orden llama a la API) se traslada 1:1; los *valores* de diseño se reutilizan vía NativeWind |
| `components/Navbar.jsx` | **No** | En iOS el patrón nativo es **Tab Bar inferior**, no navbar superior con hamburguesa — se rediseña conscientemente |
| `App.jsx`, `main.jsx`, Vite/PWA | **No** | Expo usa Expo Router (archivos en `app/`) y Metro, no `<Routes>` ni Vite |

**Cuantitativo:** la capa de datos (services+hooks, ~90% del valor reutilizable según el análisis original) pasa de "copiada" a "compartida". La UI (más grande en líneas) se reescribe igual que en v1, pero es la reescritura *fácil* — patrón conocido, sin lógica nueva, apoyada en el kit de primitivas (§5, Fase 3).

---

## 4. Comparativa de opciones (resumen)

| Dimensión | PWA (actual) | **React Native + Expo** | SwiftUI nativo |
|---|---|---|---|
| Reutilización del código React | ~100% | Lógica compartida (core) + UI reescrita | ~0% (solo referencia) |
| ¿Desarrollable en Windows? | Sí | **Sí, 100%** (Expo Go + EAS Build en la nube) | **No** (Xcode solo en macOS) |
| Feel nativo iOS | Medio-bajo | Alto (UIKit por debajo) | Máximo |
| Push en iOS | Frágil; roto en la UE por DMA | Nativo vía APNs, sin restricción DMA | Nativo |
| Coste | $0 | $0 dev/uso; $99/año solo para Fase 5 | $99/año + acceso a un Mac |
| Curva | Ninguna (ya hecho) | Media (RN core, Expo Router, secure-store) | Alta (Swift + SwiftUI + HIG) |
| Valor portfolio | Bajo-medio | **Alto** (SPA React → app móvil real + pipeline) | Alto solo si el objetivo es iOS nativo |
| Tiempo para migrar el MVP | ~0 (ya hecho) | **6.5-8.5 semanas a $0** (§5) | 12-16+ semanas (descartada por macOS) |

---

## 5. Plan de migración por fases

### Fase 0 — Spike Windows → iPhone + red (1-3 días)
**Objetivo:** confirmar que el flujo "escribo en Windows → lo veo en mi iPhone" **y** que el iPhone llega al backend FastAPI, antes de invertir tiempo real.
**Tareas:**
- `npx create-expo-app`, `npx expo start`, escanear el QR con **Expo Go** (gratis) desde el iPhone; confirmar hot-reload (modo túnel si no comparten red).
- **Arreglar CORS en dev** (§7) y verificar desde el móvil una petición real al backend por la IP LAN de la máquina Windows.
- **Validar la vía elegida (`ios-builder` + MobAI)** antes de comprometerse a ella: `builder auth github` → `builder init` → `builder ios build` sobre el proyecto Expo vacío → instalar el `.ipa` con MobAI (Apple ID gratuito, se recomienda uno nuevo). **Medir dos cosas críticas que el README no confirma:** (a) cada cuánto caduca y hay que re-firmar (¿7 días?), y (b) si algo del push funciona. Si el flujo no convence, el plan cae al fallback Ad Hoc (Fase 5B) sin perder nada.
**Requisitos externos:** iPhone físico (asunción: ya se tiene, por el objetivo de uso diario — confirmar). Cuenta de GitHub (Actions, tier gratuito ~15-20 builds/mes) + Apple ID gratuito para MobAI. Sin cuenta Apple Developer de pago, sin Mac.
**Dependencias:** ninguna. **Riesgo:** bajo para Expo Go/CORS; el spike de `ios-builder`+MobAI es *precisamente* para acotar el riesgo de la herramienta de terceros aquí y no en la semana 8.

### Fase 1 — Extraer `packages/core` compartido (~1 sem)
**Objetivo:** mover la capa de datos a un paquete compartido y dejar **la web actual funcionando igual** consumiéndolo (regresión verificada contra lo que ya existe).
**Tareas:**
- Montar `npm workspaces`; crear `packages/core`.
- Refactor de `api.js` a `createApiClient({ storage, apiUrl })` (§2); mover `*Service.js` y `hooks/*` al core; abstraer los 2 `window.alert` tras `notify()`.
- `frontend/` importa `@recetaria/core` con su adaptador `localStorage`. **Correr la web y confirmar que todo sigue igual.**
**Reutilización:** máxima — es trabajo reutilizable para siempre y de-risquea la estrategia de compartir **antes** de que el móvil dependa de ella.
**Dependencias:** Fase 0. **Tiempo:** ~1 sem. **Riesgo:** bajo-medio (la web ya existe como red de seguridad; cualquier regresión se ve al instante).

### Fase 2 — Slice vertical: Login E2E en el iPhone (~1 sem)
**Objetivo:** iniciar sesión contra el backend real **desde el iPhone**, con pantalla real. Prueba todo el stack de una.
**Tareas:**
- `mobile/` consume `@recetaria/core` con adaptador `expo-secure-store`.
- Montar **Expo Router** (routing por archivos, cercano a `react-router`) con el guard de auth (equivalente a `ProtectedRoute`).
- Esbozar la **Tab Bar** (Recetas / Lista / Planner) — decisión de UX nativa, no traducción del `Navbar`.
- Pantallas **Login/Register** completas y estiladas.
**Reutilización:** el core entero (auth); UI nueva.
**Dependencias:** Fase 1. **Tiempo:** ~1 sem. **Riesgo:** bajo (y el que hubiera, aparece aquí, no en la semana 6).

### Fase 3 — Kit de primitivas + resto de pantallas (~3 sem)
**Objetivo:** todas las pantallas del MVP corriendo en el iPhone vía Expo Go.
**Tareas:**
- **Primero (~2 días): kit de primitivas** con **NativeWind** y los tokens de `tailwind.config.js` (`primary`/`accent`/`cream`/`ink`/`sand`, radios, sombras): `<Screen>`, `<Button>`, `<Card>`, `<Input>`, `<Field>`. La identidad visual de "Claude Design" se traslada sin reinventar.
- Luego las pantallas por composición, de menor a mayor complejidad:
  1. Recetario (lista) + tarjeta — `FlatList` en vez de `<div>.map()`.
  2. Detalle de receta.
  3. Formulario crear/editar (con `expo-image-picker` en vez de `<input type="file">`).
  4. Lista de compra.
  5. Planner semanal — **rediseño**: 7 columnas de escritorio no caben en móvil → vista de un día + selector.
**Reutilización:** 0% del JSX; la lógica de cada pantalla se traslada 1:1 desde los archivos ya entendidos; el kit hace que estilar sea composición.
**Dependencias:** Fases 1 y 2. **Tiempo:** ~3 sem (antes 3-4: el kit y el patrón ya probado la acortan). **Riesgo:** medio — el planner es el mayor punto de incertidumbre de diseño; darle una pasada de diseño aparte antes de picar código.

### Fase 4 — Pulido nativo (~1 sem)
**Objetivo:** que se sienta nativa, no "React en un teléfono".
**Tareas:** ícono + splash (`expo-splash-screen`); safe areas / isla dinámica (`react-native-safe-area-context`); tamaños mínimos de toque (el criterio de la Fase 6 web se traslada); *(opcional, fuera del MVP)* `expo-notifications` (push APNs, sin restricción DMA).
**Dependencias:** Fase 3. **Tiempo:** ~1 sem. **Riesgo:** bajo.

### Fase 5A — Vía elegida: build en la nube + install a $0 con `ios-builder` + MobAI (~2-4 días)
**Objetivo:** pasar de "corre dentro de Expo Go" a **app instalada con su ícono propio en el iPhone**, sin Mac y sin pagar los $99/año.
**Precondición:** haber pasado el spike de la Fase 0 (caducidad y comportamiento medidos y aceptables). Si el spike falló, saltar a la Fase 5B.
**Tareas:**
- En el repo `mobile/`: `builder init` (detecta Expo) y `builder ios build` → GitHub Actions (runners macOS) compila y devuelve el `.ipa` a `./dist/`.
- **MobAI** firma e instala el `.ipa` en el iPhone con el Apple ID gratuito; repetir para los otros 1-2 dispositivos del grupo.
- Documentar el **procedimiento de re-firma** (cada ~7 días) para que cualquiera del grupo pueda repetirlo, o automatizarlo si MobAI lo permite.
**Matices asumidos** (heredados del Apple ID gratuito, ver §6): re-firma periódica; **sin push nativo**; dependencia de una herramienta joven de terceros y de la cuota de GitHub Actions (~15-20 builds/mes). Ninguno bloquea el uso diario, pero conviene tenerlos presentes.
**Requisitos externos:** cuenta GitHub + Apple ID gratuito. **$0.**
**Dependencias:** Fase 4 (o 3 en paralelo para validar el build real). **Tiempo:** ~2-4 días. **Riesgo:** medio — mitigado por el spike previo de la Fase 0.

### Fase 5B — Fallback estable: Ad Hoc / App Store con Apple Developer Program (opcional — $99/año)
**Objetivo:** vía sólida a largo plazo **si** se quiere push nativo, perfiles de ~1 año (sin re-firma semanal), distribución cómoda a varios dispositivos, o publicar en App Store. Recomendada si MobAI no convence, si el push se vuelve necesario, o para la historia de portfolio "publicada / distribuida oficialmente".
**⚠️ Coste $99/año.** Aclaración: los $99 pagan la **firma seria**, no la publicación — se puede hacer **distribución Ad Hoc privada sin pasar por App Store ni revisión**.
**Tareas:**
- Inscribirse en Apple Developer Program.
- **Ad Hoc (privado, sin App Store):** registrar los UDID de los iPhones del grupo (hasta 100/año) con `eas device:create`; `eas build --profile preview` (o el propio `ios-builder` con las credenciales de pago) genera el `.ipa` firmado; instalar por enlace. Perfil válido ~1 año.
- **(Opcional) App Store:** metadata (descripción, capturas, política de privacidad, cuenta demo para revisión) + `eas submit`. Solo si se decide publicar públicamente.
**Dependencias:** Fase 4. **Tiempo:** ~1 sem (Ad Hoc) / ~1-2 sem si se publica (papeleo + espera de revisión). **Riesgo:** bajo para Ad Hoc; medio para App Store (rechazo por metadata — preparar privacidad + cuenta demo antes de enviar).

**Tiempos:** F0 (1-3 d) + F1 (~1 s) + F2 (~1 s) + F3 (~3 s) + F4 (~1 s) + F5A (~2-4 d) ≈ **6.5-8.5 semanas** a $0. La Fase 5B es opcional y solo se añade si se decide pagar.

---

## 6. Requisitos y costes

| Requisito | ¿Cuándo? | Coste |
|---|---|---|
| PC Windows actual | Todo | $0 |
| iPhone físico | Desde Fase 0 | Asunción: ya se tiene — confirmar |
| Cuenta Expo (expo.dev) | Desde Fase 0 (dev) | Gratis |
| Cuenta GitHub + Actions | Fase 5A (build en la nube) | Gratis (~15-20 builds macOS/mes) |
| MobAI + Apple ID gratuito | Fase 5A (install/firma) | Gratis (verificar pricing de MobAI vigente en mobai.run) |
| Apple Developer Program | **Solo** Fase 5B (fallback) | **$99/año** (verificar vigente) |
| macOS / Xcode | **Nunca** con este plan | $0 |
| Backend FastAPI (Render) | Sin cambios | Ya cubierto |

**Comparativa de vías de distribución** (todas sin Mac):

| Vía | Coste | Ícono propio | Caducidad | Push | Estabilidad |
|---|---|---|---|---|---|
| Expo Go (solo dev) | $0 | ❌ | — | ❌ | Alta (contenedor) |
| **`ios-builder` + MobAI (elegida)** | **$0** | **✅** | ~7 días (re-firma) | ❌ | Media (terceros) |
| Ad Hoc (fallback 5B) | $99/año | ✅ | ~1 año | ✅ | Alta |
| App Store (5B opcional) | $99/año | ✅ | ~1 año | ✅ | Alta (revisión) |

**Camino a $0 elegido:** `ios-builder` (build en GitHub Actions, sin Mac) + MobAI (firma/install con Apple ID gratuito). Cierra el hueco clásico del sideload gratis en Windows — que no había forma de producir el `.ipa` sin macOS local — usando el runner macOS de GitHub en su lugar. **A cambio:** re-firma periódica, sin push, y dependencia de una herramienta joven (por eso el spike de la Fase 0). Si algo de eso no compensa, el fallback es Ad Hoc a $99/año.

---

## 7. Prerrequisito técnico: CORS en desarrollo

`backend/app/main.py:20-21`:

```python
allow_origins=["http://localhost:5173"] if settings.debug else settings.cors_origins_list,
```

En `debug` el origen está **hardcodeado** a `localhost:5173` y `cors_origins_list` se ignora — el iPhone (otro dispositivo en la LAN) **no puede** llamar al backend en desarrollo. Añadir la IP a la variable `CORS_ORIGINS` **no basta**.

**Arreglo (Fase 0):** en `debug`, permitir también los orígenes LAN. Opción robusta con regex del subred local:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"] if settings.debug else settings.cors_origins_list,
    allow_origin_regex=r"http://192\.168\.\d+\.\d+:\d+" if settings.debug else None,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
```

*(Ajustar el rango a la red real; verificar los otros parámetros del middleware ya presentes.)*

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Planner (7 columnas) no traduce a móvil | Medio (alarga Fase 3) | Rediseñar (día + selector) **antes** de picar código |
| ~~Mantener dos frontends duplica el trabajo futuro~~ | **Mitigado por diseño** | El core compartido (§2) hace que la lógica de una feature nueva se escriba **una vez**; solo la UI se duplica |
| Regresión en la web al extraer el core (Fase 1) | Medio | La web ya existente es la red de seguridad: correrla tras el refactor detecta cualquier ruptura al instante |
| CORS/red local iPhone ↔ backend | Bajo, pero bloquea | Arreglo de §7 en Fase 0, no sobre la marcha |
| Restricciones Apple sobre PWA en la UE cambian | Bajo para RN (no depende de PWA) | No depender de la PWA para push/instalación fiable en iOS-UE |
| **MobAI (terceros) falla, se vuelve de pago o rompe la firma** | Medio (bloquea la vía elegida) | Validarlo en el spike de la Fase 0 **antes** de depender de él; mantener el fallback Ad Hoc (5B, $99) siempre disponible; nada del código depende de MobAI, solo la distribución |
| Caducidad ~7 días del Apple ID gratuito molesta en uso diario | Medio | Documentar/automatizar la re-firma; si pesa demasiado, pasar a Fase 5B |
| Cuota de GitHub Actions macOS agotada | Bajo | ~15-20 builds/mes bastan para un proyecto solo; iterar con Expo Go (hot-reload), no con builds |
| Rechazo en revisión de App Store por metadata | Bajo-medio | Solo aplica si se hace la 5B pública; privacidad + cuenta demo listas antes de enviar |
| Subestimar la Fase 3 por "solo es reescribir UI" | Medio | Tratarla como ~50% del tiempo; el kit ayuda pero cada pantalla se escribe de cero |

---

## 9. Próximos pasos inmediatos

1. Confirmar que hay un **iPhone físico** disponible (Fase 0 lo requiere).
2. Ejecutar la **Fase 0** como primer paso concreto: spike Expo Go + arreglo CORS de §7 **+ validación de `ios-builder`+MobAI** (medir caducidad y push). Es corta, de bajo riesgo, y decide si la vía elegida a $0 es viable o hay que ir al fallback Ad Hoc.
3. Objetivo por defecto: **Fases 0-4 + 5A a $0** (app con ícono propio vía `ios-builder`+MobAI). La **Fase 5B ($99/año)** queda como fallback, a decidir solo si el spike no convence o si se quiere push/App Store — sin perder trabajo previo.
4. Decidir si la **PWA actual** se mantiene como complemento web durante la migración (con el core compartido, esto ahora es barato de sostener).
5. **No** inscribirse en Apple Developer Program salvo que se active la Fase 5B.
