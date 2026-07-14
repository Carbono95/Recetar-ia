# RecetarIA — Plan de migración a iOS

**Fecha:** julio 2026
**Autor:** Análisis generado con Claude Code, a partir de `CLAUDE.md` y el código en `frontend/src/`.
**Nota sobre `SKILL.md`:** el prompt original pedía leer `SKILL.md` además de `CLAUDE.md`. Ese archivo no existe en la raíz del repo (solo hay `SKILL.md` internos de Claude Code bajo `.claude/skills/`, que no son documentación del proyecto). Este plan se basa únicamente en `CLAUDE.md` y en la inspección directa del código — asunción declarada.

---

## 1. Resumen ejecutivo

Se recomienda **React Native + Expo** para migrar RecetarIA a iOS. Es la única
opción de las tres que es 100% desarrollable en Windows de principio a fin,
sin necesidad de macOS en ningún momento. Reutiliza directamente ~90% de
`services/` y `hooks/` (la lógica de negocio y las llamadas a la API
FastAPI, que no cambia), aunque exige reescribir el 100% de la capa visual
(`components/`, `pages/`, estilos Tailwind) porque React Native no renderiza
HTML/CSS. **Importante sobre el coste:** desarrollar y usar la app a diario
en el propio iPhone vía Expo Go es y seguirá siendo $0; lo que sí tiene un
piso de coste real e ineludible de $99/año es tener un binario instalable
con ícono propio o publicar en el App Store (Fase 5) — EAS Build en la nube
evita necesitar un Mac, pero no evita la cuenta de pago de Apple para firmar
builds de dispositivo físico. La PWA que ya existe (Fase 6) es la otra
opción de coste cero, pero en iOS dentro de la UE tiene una limitación seria
y verificada: desde marzo 2024 Apple, por cumplimiento de la DMA, hace que
las PWA se abran dentro de Safari en vez de en modo standalone, lo que anula
notificaciones push y buena parte de la sensación de "app instalada". Nativo
SwiftUI queda descartado de raíz: no hay forma de desarrollar ni compilar
Swift/Xcode sin macOS, y no hay Mac disponible en este entorno.

---

## 2. Análisis del código actual reutilizable

Inspección de `frontend/src/` (React 18 + Vite + Tailwind, sin Redux/Zustand
— estado local con hooks + Context).

| Carpeta / archivo | Qué contiene | Reutilización en PWA | Reutilización en RN+Expo | Reutilización en SwiftUI nativo |
|---|---|---|---|---|
| `services/api.js` | Cliente `fetch` genérico, headers `Authorization: Bearer`, manejo de 401, `uploadFile` con `FormData` | 100% (sin cambios) | ~90% — mismo `fetch`, mismo contrato de la API; solo cambia dónde se guarda el token (ver abajo) y cómo se construye el `FormData` para subir imágenes (RN usa `{ uri, name, type }` en vez de un objeto `File` del navegador) | 0% como código — pero el contrato de la API (endpoints, payloads, códigos de error) se reimplementa 1:1 con `URLSession`/`Alamofire` |
| `services/authService.js`, `recipeService.js`, `shoppingService.js`, `mealPlanService.js` | Wrappers finos sobre `api.js` por dominio | 100% | ~95% (dependen de `api.js`, que apenas cambia) | 0% código, 100% el diseño/contrato de los endpoints |
| `hooks/useAuth.js`, `useRecipes.js`, `useShopping.js`, `useMealPlan.js` | Lógica de estado (`useState`/`useEffect`/`useCallback`), optimistic updates, sin ninguna API del DOM salvo `window.alert` (2 usos, triviales de sustituir por `Alert.alert` de RN) | 100% | ~90% (mismo patrón de hooks; solo cambian esos `window.alert` y, en `AuthContext.jsx`, `localStorage`) | 0% código — la lógica de negocio (qué llamar, cuándo, optimistic UI) se reescribe en Swift pero el *diseño* de la lógica es 100% reutilizable como referencia |
| `context/AuthContext.jsx` | Guarda `access_token`/`refresh_token` en `localStorage`, expone `login/register/logout/user` | 100% | ~85% — mismo patrón de Context, pero `localStorage` → `expo-secure-store` (más apropiado para tokens JWT en móvil) | 0% código — en iOS el análogo es Keychain |
| `components/ProtectedRoute.jsx` | Guard de rutas + monta `<Navbar/>` | 100% | ~30% — la idea (guard que redirige si no hay sesión) se traduce a un layout de Expo Router, pero la implementación cambia | 0% |
| `components/Navbar.jsx` | Barra superior sticky + menú hamburguesa en mobile | 100% (ya es responsive, Fase 6) | 0% directo — en iOS el patrón nativo esperado es una Tab Bar inferior, no un navbar superior con hamburguesa; se rediseña, no se traduce | 0% |
| `pages/*.jsx`, `components/RecipeCard.jsx`, `SearchBar.jsx`, `MealPlanDay.jsx`, `ShoppingListItem.jsx`, `forms/RecipeForm.jsx` | Todo el árbol de UI: `<div>`, `<input>`, clases Tailwind (`bg-primary-500`, `rounded-[18px]`, etc.) | 100% | **0% el JSX/HTML**, pero ~70-80% la **lógica interna** de cada componente (qué estado maneja, qué valida, en qué orden llama a la API) se traslada 1:1 a un componente RN equivalente. Los *valores* de diseño (paleta `primary`/`accent`/`cream`/`ink`/`sand`, radios, sombras) sí se reutilizan como configuración de NativeWind (ver Fase 3) | 0%, salvo como referencia de UX/flujo |
| `tailwind.config.js` | Paleta y tokens de diseño (ver commits recientes de "Claude Design") | 100% | Los *valores* (hex, radios) son reutilizables tal cual como `tailwind.config.js` de **NativeWind**; la sintaxis de clases (`bg-primary-500`) es casi idéntica | 0% — se traduce a `Color` assets / `ShapeStyle` en SwiftUI |
| `App.jsx`, `main.jsx` | Routing con `react-router-dom`, montaje de `AuthProvider` | 100% | 0% — Expo Router usa archivos en `app/` en vez de `<Routes>`; el *concepto* (rutas protegidas, `AuthProvider` envolviendo todo) se mantiene | 0% |
| Vite, `vite-plugin-pwa`, `vite.config.js` | Build tool, manifest/SW de la PWA (Fase 6) | Es literalmente el output de esto | 0% — Expo usa Metro bundler, no Vite | 0% |

**Resumen cuantitativo** (aproximado, sobre líneas de código de `frontend/src/`):
- **PWA**: ~100% reutilizable, 0% reescritura. Es shippear lo que ya existe.
- **React Native + Expo**: ~90% reutilizable en `services/`+`hooks/` (que es la parte que habla con el backend y contiene las reglas de negocio), ~0% reutilizable en `components/`+`pages/` (que es la parte visual). Como el árbol de UI es más grande en líneas que la capa de datos, la reescritura real ronda el **55-65% de las líneas totales del frontend**, pero es la reescritura *fácil* — patrones ya conocidos, sin lógica nueva que inventar.
- **SwiftUI nativo**: ~0% código reutilizable; 100% del *conocimiento* del dominio (qué hace cada pantalla, contrato de la API) es transferible pero hay que reimplementar todo en un lenguaje y framework nuevos.

---

## 3. Comparativa de opciones

| Dimensión | 1. PWA (actual) | 2. React Native + Expo | 3. Nativa SwiftUI |
|---|---|---|---|
| Reutilización del código React actual | ~100% | ~55-65% (servicios/hooks casi intactos, UI reescrita) | ~0% (solo como referencia de diseño) |
| Reutilización del conocimiento del dev (ya sabe React) | Total | Alta — mismo lenguaje (JS/JSX), mismos hooks, mismo modelo mental de componentes | Baja — Swift es un lenguaje distinto, SwiftUI tiene su propio paradigma declarativo (parecido en espíritu a React, pero sintaxis y ecosistema nuevos) |
| ¿Desarrollable en Windows? | Sí, 100% | Sí, 100% — Expo Go corre en el iPhone físico sin macOS; **el build final para App Store también se hace sin Mac** vía EAS Build (build en la nube) | **No** — Xcode solo existe para macOS, no hay simulador de iOS en Windows ni forma soportada de compilar Swift para iOS sin un Mac |
| Requisitos para publicar en App Store | No aplica (no se distribuye por App Store; se instala desde el navegador) | Apple Developer Program ($99/año) + `eas submit` (incluido en Expo, sube el binario sin Mac) | Apple Developer Program ($99/año) + un Mac físico o en la nube (MacStadium, GitHub Actions con runner macOS, etc.) + Xcode |
| Curva de aprendizaje | Ninguna (ya está hecho) | Media — nuevos: componentes core de RN (`View`/`Text`/`FlatList` en vez de HTML), navegación (Expo Router/React Navigation en vez de `react-router`), `AsyncStorage`/`SecureStore` en vez de `localStorage` | Alta — Swift + SwiftUI + Combine/async-await de Apple + Xcode + convenciones de HIG (Human Interface Guidelines) desde cero |
| Experiencia/feel nativo en iOS | Media-baja — es una web envuelta; con `display: standalone` se acerca, pero gestos, gráficos y rendimiento no son nativos | Alta — componentes reales de UIKit por debajo, animaciones y scroll nativos, se siente como una app de verdad | Máxima — es literalmente lo que Apple recomienda y optimiza |
| Notificaciones push en iOS | **Limitado y frágil** (confirmar en el momento de implementar): funciona solo si el usuario instaló la PWA vía "Añadir a pantalla de inicio", requiere iOS ≥ 16.4, y **en la Unión Europea, desde marzo 2024, Apple hace que las PWA se abran dentro de Safari en vez de en modo standalone por cumplimiento de la DMA — lo que en la práctica rompe el push y la sensación de app instalada para usuarios en la UE**. Ha habido idas y vueltas de Apple sobre esta restricción; verificar el estado exacto al momento de decidir. | Nativo vía APNs (`expo-notifications`), sin las restricciones de la DMA que afectan a las PWA — funciona igual en la UE que en el resto del mundo | Nativo vía APNs, control total |
| Capacidades offline | Vía Service Worker (cache de assets ya configurado en Fase 6); cachear datos de la API es trabajo adicional | Buenas — `AsyncStorage`/SQLite local + lógica de sincronización a implementar | Máximas — Core Data / SQLite con control total |
| Coste económico | $0 | $0 de herramientas (Expo/RN son open source) + Apple Developer Program $99/año **solo si se publica en App Store o se prueba vía TestFlight** (no hace falta para desarrollar ni para probar con Expo Go); EAS Build tiene tier gratuito (15 builds de iOS al mes — confirmar el límite exacto en expo.dev/pricing al momento de usarlo, estos límites cambian) | $99/año (Apple Developer Program, obligatorio para compilar y firmar, incluso para pruebas ad-hoc) + coste de acceso a un Mac (compra, alquiler en la nube, o pedir uno prestado) |
| Mantenimiento a largo plazo | Bajo — un solo código, pero limitado por las restricciones de Apple sobre PWA en iOS, que pueden cambiar sin aviso | Medio — dos "targets" conceptuales (web y móvil) pero comparten backend y gran parte de la lógica; Expo/RN tienen buen ritmo de actualizaciones | Alto si en el futuro se quiere también Android (habría que mantener un segundo proyecto nativo en Kotlin) |
| Valor para el portfolio | Bajo-medio — "sabe hacer una PWA" es un mérito menor hoy | **Alto** — demuestra capacidad de llevar una SPA React a producción móvil real, con build pipeline (EAS), publicación en App Store y arquitectura compartida cliente-servidor; es una habilidad muy solicitada (React Native es uno de los frameworks móviles cross-platform más usados en la industria) | Alto en un contexto "quiero trabajo de iOS nativo", pero de menor valor relativo aquí porque no aprovecha nada del trabajo React ya hecho, y el objetivo declarado del proyecto es portfolio DAW + uso personal, no especialización iOS |
| Estimación de tiempo para migrar el MVP actual | ~0 semanas (ya está hecho, Fase 6) | **7-10 semanas** (ver plan por fases, sección 5) | 12-16+ semanas estimadas (reescritura completa + curva de aprendizaje de Swift/SwiftUI desde cero) — no se detalla plan de fases porque la opción queda descartada por el bloqueante de macOS |

---

## 4. Recomendación justificada

**Recomendación: React Native + Expo.**

Para el caso concreto de RecetarIA (Windows sin Mac, desarrollador único,
doble objetivo portfolio + uso diario, backend FastAPI que no cambia), esta
es la única opción que no tiene un bloqueante duro:

- **SwiftUI queda descartado por la restricción declarada explícitamente en
  el prompt**: no hay macOS/Xcode disponibles, y no existe una vía soportada
  por Apple para desarrollar o compilar apps iOS nativas en Windows. Sería
  necesario adquirir o alquilar acceso a un Mac antes de escribir una sola
  línea de Swift — esto cambia el problema de "elegir un framework" a
  "resolver primero un problema de infraestructura".
- **La PWA ya existe** (Fase 6 de este mismo proyecto) y tiene coste de
  migración cero, pero no es realmente una *migración a app móvil* — sigue
  siendo la web, con las limitaciones de Apple sobre PWA en iOS (y muy
  especialmente la limitación específica de la UE desde marzo 2024, que es
  justo donde previsiblemente está el desarrollador/usuario dado que toda la
  documentación del proyecto está en español). No cumple el objetivo de
  "aplicación móvil centrada en iOS" que pide el prompt, aunque sigue siendo
  una base perfectamente válida como *complemento* (ver sección 8).
- **React Native + Expo** reutiliza el conocimiento de React ya adquirido,
  reutiliza directamente la capa de `services/`+`hooks/` (que es donde vive
  el conocimiento del dominio: cómo hablar con la API, reglas de
  favoritos/deduplicación/optimistic updates), y **resuelve por completo el
  problema de "no tengo Mac"**: Expo Go permite desarrollar y probar en un
  iPhone físico real desde el primer día sin macOS, y EAS Build compila y
  firma el binario final en la nube — el Mac deja de ser un requisito en
  ningún punto del proceso, ni siquiera para la publicación en App Store
  (`eas submit` sube el binario directamente).
- Para el portfolio, "migré una SPA React a una app móvil real con React
  Native/Expo, reutilizando el backend FastAPI y ~90% de la lógica de
  negocio" es una historia más fuerte y más verificable (app instalable
  desde el App Store) que "hice una PWA".

**¿Cuándo otra opción sería mejor?**
- Si el objetivo fuera *exclusivamente* dominar el ecosistema nativo de
  Apple para un puesto de trabajo específico de iOS: SwiftUI nativo, pero
  entonces la prioridad número uno pasaría a ser conseguir acceso a un Mac,
  no elegir framework.
- Si el objetivo fuera solo "tener un icono en el escritorio del móvil" sin
  publicar en App Store ni pulir la experiencia nativa, y el uso fuera
  mayoritariamente en Android o en iOS fuera de la UE: la PWA actual ya
  cumple, sin invertir ni una hora más.
- Si en el futuro se quisiera también Android nativo con máximo rendimiento
  específico de plataforma (no cross-platform): apps nativas separadas
  (SwiftUI + Kotlin), pero es un salto de alcance y tiempo mucho mayor que
  no encaja con "desarrollador solo, proyecto de prácticas".

---

## 5. Plan de migración por fases (React Native + Expo)

### Fase 0 — Spike de validación del pipeline Windows → iPhone
**Objetivo:** confirmar, antes de invertir tiempo real, que todo el flujo
"escribo código en Windows → lo veo correr en mi iPhone" funciona sin
fricción.
**Tareas:**
- Instalar Node/Expo CLI (`npx create-expo-app`).
- Crear un proyecto Expo vacío, correr `npx expo start`, escanear el QR con
  la app **Expo Go** (gratis, App Store) desde el iPhone.
- Confirmar hot-reload y que el iPhone y el PC están en la misma red (o usar
  el modo túnel de Expo si no lo están).
**Reutilización de código actual:** ninguna todavía — es un proyecto Expo
nuevo y vacío.
**Requisitos externos:** un iPhone físico (asunción: el desarrollador ya
tiene uno, dado el objetivo de "uso diario personal" — a confirmar). No
requiere cuenta de Apple Developer ni Mac.
**Dependencias:** ninguna, es el punto de partida.
**Tiempo estimado:** 1-3 días.
**Riesgo:** bajo. Si algo falla aquí (red, firewall de Windows bloqueando el
puerto de Metro, etc.) es mejor descubrirlo ahora que a mitad de migración.

### Fase 1 — Portar la capa de datos (`services/` + `hooks/`)
**Objetivo:** tener toda la lógica de negocio funcionando contra el backend
FastAPI real, sin ninguna pantalla todavía (verificable con `console.log`
o una pantalla de debug mínima).
**Tareas:**
- Copiar `services/api.js` y adaptarlo: `localStorage` → `expo-secure-store`
  (más apropiado para JWT que `AsyncStorage`, que no está cifrado); el
  `uploadFile` con `FormData` cambia la forma de referenciar el archivo
  (`{ uri, name, type }` en vez de un `File` del navegador).
- Copiar `authService.js`, `recipeService.js`, `shoppingService.js`,
  `mealPlanService.js` casi sin cambios (dependen de `api.js`).
- Copiar `hooks/useAuth.js` (vía un `AuthContext` adaptado),
  `useRecipes.js`, `useShopping.js`, `useMealPlan.js`, sustituyendo los 2
  usos de `window.alert` por `Alert.alert` de React Native.
- Configurar `VITE_API_URL` → variable de entorno equivalente en Expo
  (`app.config.js` + `expo-constants`), apuntando al backend FastAPI (en
  desarrollo, la IP local de la máquina Windows en la red, no
  `localhost`, porque el iPhone es un dispositivo distinto en la red).
**Reutilización:** máxima de todo el plan — esta es la fase donde se
recupera el ~90% de reutilización de `services/`+`hooks/` de la sección 2.
**Requisitos externos:** ninguno nuevo.
**Dependencias:** Fase 0.
**Tiempo estimado:** ~1 semana.
**Riesgo:** medio-bajo. El punto más delicado es CORS/red (el backend debe
aceptar peticiones desde la IP del iPhone en la red local durante
desarrollo) — mitigar añadiendo la IP local a `CORS_ORIGINS` en desarrollo,
reutilizando el mecanismo que ya existe en `backend/app/core/config.py`
desde la Fase 6 de este proyecto.

### Fase 2 — Navegación y shell de la app
**Objetivo:** tener la estructura de pantallas navegable (aunque estén
vacías), con el guard de autenticación funcionando.
**Tareas:**
- Elegir y montar **Expo Router** (recomendado: routing por archivos, más
  parecido conceptualmente a lo que ya se conoce de `react-router-dom` que
  React Navigation "a mano").
- Recrear `ProtectedRoute.jsx` como un layout de Expo Router que redirige a
  login si no hay sesión.
- Diseñar la navegación principal como **Tab Bar inferior** (Recetas /
  Lista de compra / Planner) en vez del navbar superior actual — es la
  convención nativa de iOS y una decisión consciente de UX, no una
  traducción literal del `Navbar.jsx` web.
**Reutilización:** conceptual (la idea del guard, las mismas rutas lógicas),
no de código.
**Requisitos externos:** ninguno nuevo.
**Dependencias:** Fase 1 (necesita `AuthContext` ya portado).
**Tiempo estimado:** ~1 semana.
**Riesgo:** bajo.

### Fase 3 — Reescritura de pantallas (la fase más larga)
**Objetivo:** todas las pantallas del MVP funcionando en el iPhone vía
Expo Go.
**Tareas** (orden recomendado, de menor a mayor complejidad):
1. Login / Register — valida el flujo de auth de punta a punta.
2. Recetario (lista) + tarjeta de receta — usa `FlatList` en vez de un
   `<div>` con `.map()`; aquí se decide el enfoque de estilos.
3. Detalle de receta.
4. Formulario crear/editar receta (incluye `expo-image-picker` para subir
   foto, reemplazando el `<input type="file">` web).
5. Lista de compra.
6. Planner semanal (la pantalla más compleja visualmente — 7 columnas de
   escritorio no tienen sentido en móvil; se rediseña como una lista de
   días o un selector de día + detalle).

**Decisión de estilos recomendada:** usar **NativeWind** (Tailwind para
React Native, misma sintaxis de clases). Esto permite reutilizar
directamente los tokens de `tailwind.config.js` (colores `primary`,
`accent`, `cream`, `ink`, `sand`, radios, sombras) que ya se definieron para
el rediseño de Claude Design — la identidad visual de la app se traslada
prácticamente sin reinventar nada, aunque el JSX de cada pantalla sí se
reescribe.

```js
// Ejemplo ilustrativo — mismo patrón de clases, distinto framework
// Web (RecipeCard.jsx):        <div className="bg-white rounded-[18px] shadow-cardSm ...">
// RN + NativeWind (RecipeCard.tsx): <View className="bg-white rounded-[18px] shadow-cardSm ...">
```

**Reutilización:** 0% del JSX, pero la lógica interna de cada componente
(qué estado tiene, cuándo llama a la API, cómo valida un formulario) se
traslada 1:1 desde los archivos ya leídos y entendidos en la Fase 1.
**Requisitos externos:** ninguno nuevo (todo se prueba con Expo Go).
**Dependencias:** Fases 1 y 2.
**Tiempo estimado:** ~3-4 semanas (la mayor parte del esfuerzo total).
**Riesgo:** medio. El planner semanal es el punto de mayor incertidumbre de
diseño (el layout de 7 columnas no traslada bien a una pantalla de móvil) —
mitigar dedicándole tiempo de diseño aparte antes de picar código, y no
subestimarlo en la planificación.

### Fase 4 — Integraciones nativas y pulido
**Objetivo:** que la app se sienta nativa, no solo "React que corre en un
teléfono".
**Tareas:**
- Icono de app y splash screen (`expo-splash-screen`).
- Manejo correcto de "safe areas" (notch/isla dinámica) con
  `react-native-safe-area-context`.
- Revisar accesibilidad táctil (tamaños mínimos de toque, ya se trabajó
  esto en la Fase 6 web — el criterio se traslada).
- (Opcional, fuera del MVP) `expo-notifications` para push nativo vía APNs,
  sin las restricciones de la DMA que sí afectan a la PWA.
**Reutilización:** ninguna de código, pero sí de criterio (los ajustes de
touch-target de la Fase 6 web informan directamente los mismos ajustes aquí).
**Requisitos externos:** ninguno nuevo para lo obligatorio; APNs para push
(gratis, pero requiere cuenta de Apple Developer — ver Fase 5).
**Dependencias:** Fase 3.
**Tiempo estimado:** ~1 semana.
**Riesgo:** bajo.

### Fase 5 — Build nativo, distribución y publicación (opcional — ver alternativa gratuita abajo)
**Objetivo:** pasar de "corre en Expo Go" a "app instalable de verdad",
hasta llegar al App Store si se decide publicar.

**⚠️ Esta fase es la única del plan que tiene un coste obligatorio de $99/año.**
Verificado explícitamente (no es una suposición): un **EAS Build en la nube
que se pueda instalar y correr en un iPhone físico exige una cuenta de pago
del Apple Developer Program para firmar el binario**, sin excepción — el
nivel gratuito de EAS solo sirve para builds de simulador, y el simulador de
iOS únicamente corre en macOS, que no está disponible aquí. No hay forma de
evitar este requisito de pago si el objetivo es tener un binario instalable
en el propio iPhone (ni hablar ya de publicar en el App Store) generado
desde Windows. Si el presupuesto es $0 de forma indefinida, la alternativa
real es **quedarse en la Fase 3 y usar la app siempre a través de Expo Go**
(sección 6 lo detalla) — funciona perfectamente para uso personal diario, a
cambio de no tener ícono propio ni poder publicarla.

**Tareas (si se decide pagar y avanzar con esta fase):**
- Inscribirse en el **Apple Developer Program ($99/año)** — necesario a
  partir de este punto, no antes.
- Configurar `eas.json` y correr el primer **EAS Build** en la nube (sin
  Mac, pero sí con la cuenta de pago ya activa) para generar un binario iOS
  real.
- Instalar ese binario directamente en el iPhone propio vía distribución
  interna de Expo (sin pasar por TestFlight) para validar que el build de
  producción funciona igual que en Expo Go.
- (Opcional) Publicar una build en **TestFlight** si se quiere que otras
  personas la prueben antes del lanzamiento público.
- Preparar metadata de App Store: descripción, capturas de pantalla,
  política de privacidad (obligatoria incluso para una app personal si se
  distribuye públicamente), cuenta de demo para el equipo de revisión de
  Apple si la app requiere login.
- `eas submit` para subir el binario final al App Store (sin Mac).
- Esperar la revisión de Apple.
**Reutilización:** ninguna de código.
**Requisitos externos:** Apple Developer Program ($99/año, obligatorio desde
esta fase). EAS Build (nivel gratuito suele bastar para un proyecto solo —
confirmar el límite mensual vigente en expo.dev/pricing al llegar aquí,
estos límites cambian con el tiempo).
**Dependencias:** Fase 4 (o incluso Fase 3, si se quiere validar el build
nativo en paralelo mientras se siguen puliendo pantallas).
**Tiempo estimado:** ~1-2 semanas (gran parte es papeleo/espera de revisión,
no código).
**Riesgo:** medio. El riesgo típico en primeras publicaciones es un rechazo
de Apple por metadata incompleta (política de privacidad, cuenta de demo) —
mitigar preparando esos materiales *antes* de enviar el build a revisión, no
después de un primer rechazo.

**Resumen de tiempos:** Fase 0 (1-3 días) + Fase 1 (~1 sem) + Fase 2 (~1 sem)
+ Fase 3 (~3-4 sem) + Fase 4 (~1 sem) + Fase 5 (~1-2 sem) ≈ **7-10 semanas**
de trabajo a dedicación de proyecto de prácticas (no full-time).

---

## 6. Requisitos y costes

| Requisito | ¿Cuándo hace falta? | Coste |
|---|---|---|
| PC Windows actual | Todo el proyecto | $0 (ya existe) |
| iPhone físico | Desde Fase 0 (para probar con Expo Go) | Asunción: ya se tiene, dado el objetivo de "uso diario personal" — confirmar |
| Cuenta de Expo (expo.dev) | Desde Fase 0 | Gratis |
| Apple Developer Program | Solo si se llega a la Fase 5 (build nativo firmado / TestFlight / App Store) | **$99/año**, verificar precio vigente en developer.apple.com al momento de inscribirse |
| EAS Build (nivel gratuito) | Desde Fase 5, pero **solo cubre builds de simulador**, no instalables en un iPhone físico | $0, pero no resuelve "quiero probarlo en mi teléfono" sin la cuenta de pago |
| macOS / Xcode | **Nunca**, con este plan | $0 — es precisamente lo que este plan evita necesitar |
| Backend FastAPI (Render, según Fase 6 de este proyecto) | Sin cambios | Ya cubierto en el plan de deploy existente |

### ¿Hay una forma de hacer esto sin pagar nada, nunca?

Sí, con un límite claro. Opciones evaluadas, de más a menos realista dado el
contexto (Windows, sin Mac):

1. **Quedarse en Expo Go indefinidamente (Fases 0-4, sin Fase 5) — $0 real.**
   La app se desarrolla, se usa a diario y se actualiza abriéndola dentro de
   la app Expo Go en el iPhone. No hay ícono propio en pantalla de inicio, no
   se puede compartir como app instalable ni publicar en App Store, pero
   cumple 100% el objetivo de "herramienta de uso diario personal". Para el
   objetivo de portfolio pesa menos que "publicada en el App Store", pero
   sigue siendo una demostración real de una app React Native funcionando
   contra un backend propio.
2. **Sideload con Apple ID gratuito (AltStore / Sideloadly) — $0 de cuota
   de Apple, pero con un techo de infraestructura que no se puede evitar
   aquí.** Apple permite firmar apps con un Apple ID gratuito e instalarlas
   sin pagar el Developer Program, sin necesidad de Mac *para el paso de
   sideload en sí* (herramientas como Sideloadly corren en Windows) — pero
   la app expira cada 7 días y hay que re-firmarla. El problema real: para
   producir el archivo `.ipa` compilado en primer lugar, sin macOS local, la
   única vía es EAS Build en la nube, y **EAS Build exige la cuenta de pago
   precisamente para builds de dispositivo físico** (verificado, ver Fase
   5) — así que este camino solo funciona si en algún momento se consigue
   acceso puntual a un Mac (de un compañero, un laboratorio de la
   universidad) para generar el `.ipa` sin cuenta de pago; desde ahí sí se
   podría re-firmar semanalmente desde Windows sin pagar los $99/año.
3. **Alquiler de Mac en la nube (MacinCloud y similares)** — no es gratis,
   pero es mucho más barato que comprometerse a $99/año si el Mac solo hace
   falta puntualmente para generar builds.

**Conclusión honesta:** con el objetivo de tener la app funcionando de forma
fiable y cómoda en el propio iPhone sin pagar nunca nada, la opción 1 (Expo
Go permanente) es la única que no depende de conseguir acceso a un Mac ni de
procesos manuales de re-firma cada semana. Publicar en el App Store —o
incluso solo tener un ícono propio instalado— tiene un piso de coste real de
$99/año que este plan no puede eludir sin acceso a macOS.

---

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El planner semanal (7 columnas) no traduce bien a pantalla móvil | Medio — puede alargar la Fase 3 | Diseñar esa pantalla aparte (vista de un día + selector, en vez de las 7 columnas) antes de empezar a picar código, no sobre la marcha |
| Restricciones de Apple sobre notificaciones/instalación de PWA en la UE cambian con el tiempo (ya han cambiado varias veces desde 2024) | Bajo para este plan (RN no depende de esto), pero relevante si en algún momento se reconsidera la PWA como alternativa | No depender de la PWA para nada que requiera push/instalación fiable en iOS-UE; tratarla solo como complemento web, no como sustituto de la app nativa |
| Mantener dos frontends (web + móvil) duplica el trabajo futuro de nuevas features | Medio, a largo plazo | Mantener toda la lógica de negocio nueva en un patrón similar a `services/`+`hooks/` para que portar una feature nueva de web a móvil sea mecánico, no un rediseño |
| Primer rechazo en la revisión de App Store por metadata incompleta | Bajo-medio, retrasa la publicación días/semanas | Preparar política de privacidad y cuenta de demo *antes* de enviar a revisión (Fase 5) |
| CORS/red local entre el iPhone y el backend FastAPI en desarrollo | Bajo, pero bloquea si no se prevé | Usar la IP local de la máquina Windows (no `localhost`) y añadirla a `CORS_ORIGINS` en desarrollo; ya existe ese mecanismo desde la Fase 6 de este proyecto |
| Expo Go no soporta ciertos módulos nativos "custom" fuera de lo estándar (relevante solo si en v2 se añaden features muy específicas, p. ej. algo de IA on-device) | Bajo para el MVP actual (nada de lo descrito lo requiere) | Si aparece esa necesidad, usar un "development build" de EAS (sigue sin requerir Mac) en vez de Expo Go puro |
| Subestimar el tiempo por ser "solo reescribir UI que ya existe en React" | Medio | Tratar la Fase 3 como el 50%+ del tiempo total del plan, no como un trámite — el patrón se conoce, pero cada pantalla se escribe de cero |

---

## 8. Próximos pasos inmediatos

1. Confirmar la asunción de que hay un iPhone físico disponible para
   desarrollo/pruebas (Fase 0 lo requiere).
2. Decidir de entrada el presupuesto: si es $0 indefinido, el plan objetivo
   son las **Fases 0-4** (app completa, usada a diario vía Expo Go, sin
   ícono propio ni App Store); si se acepta el gasto de $99/año en algún
   momento, se añade la Fase 5. No hace falta decidirlo de forma
   irreversible ahora — se puede empezar apuntando a Fases 0-4 y añadir la
   Fase 5 más adelante sin perder nada del trabajo previo.
4. Decidir si la PWA actual (ya lista desde la Fase 6) se mantiene como
   complemento web mientras se hace esta migración, o si el foco pasa
   por completo a React Native durante el tiempo que dure el plan.
5. Ejecutar la Fase 0 (spike Expo Go) como primer paso concreto — es corta,
   de bajo riesgo, y confirma o descarta el bloqueante de infraestructura
   antes de comprometer semanas de trabajo.
6. Solo después de validar la Fase 0, decidir si se continúa con las Fases
   1-5 tal como están planteadas o se ajusta el alcance.
7. No inscribirse todavía en el Apple Developer Program — no hace falta
   hasta la Fase 5; esperar evita pagar $99 antes de saber si el resto del
   plan es viable.
