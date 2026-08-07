// API pública de @recetaria/core: lo que consumen la web y (en Fase 2) el móvil.
// La lógica es agnóstica de plataforma; cada app inyecta lo suyo al arrancar
// con configureApi() y setNotifier().

export { createApiClient } from "./createApiClient";
export { configureApi, api } from "./apiClient";
export { notify, setNotifier } from "./notify";

export { default as authService } from "./services/authService";
export { default as recipeService } from "./services/recipeService";
export { default as shoppingService } from "./services/shoppingService";
export { default as mealPlanService } from "./services/mealPlanService";

export { useRecipes } from "./hooks/useRecipes";
export { useShopping } from "./hooks/useShopping";
export { useMealPlan } from "./hooks/useMealPlan";
