import { api } from "../apiClient";

const shoppingService = {
  generate: (recipeIds) => api.post("/api/v1/shopping/generate", { recipe_ids: recipeIds }),
  get: () => api.get("/api/v1/shopping"),
  clear: () => api.del("/api/v1/shopping"),
  checkItem: (itemId, checked) => api.patch(`/api/v1/shopping/${itemId}/check`, { checked }),
  // Artículo añadido a mano (no procede de una receta).
  addItem: ({ ingredientName, totalQuantity = "", unit = null }) =>
    api.post("/api/v1/shopping/items", {
      ingredient_name: ingredientName,
      total_quantity: totalQuantity,
      unit,
    }),
  removeItem: (itemId) => api.del(`/api/v1/shopping/${itemId}`),
};

export default shoppingService;
