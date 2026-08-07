import { api } from "../apiClient";

const mealPlanService = {
  getWeek: (weekLabel) => api.get(`/api/v1/meal-plan?week=${weekLabel}`),
  addEntry: (recipeId, date, mealType) =>
    api.post("/api/v1/meal-plan", { recipe_id: recipeId, date, meal_type: mealType }),
  removeEntry: (entryId) => api.del(`/api/v1/meal-plan/${entryId}`),
  generateWeeklyShoppingList: (weekLabel) => api.post(`/api/v1/meal-plan/generate-shopping?week=${weekLabel}`),
};

export default mealPlanService;
