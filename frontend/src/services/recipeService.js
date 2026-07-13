import api from "./api";

function buildQueryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

const recipeService = {
  list: (filters = {}) => {
    const { page = 1, size = 20, q, categoryId, difficulty, timeMax, favoritesOnly } = filters;
    const queryString = buildQueryString({
      page,
      size,
      q,
      category_id: categoryId,
      difficulty,
      time_max: timeMax,
      favorites_only: favoritesOnly || undefined,
    });
    return api.get(`/api/v1/recipes${queryString}`);
  },
  get: (recipeId) => api.get(`/api/v1/recipes/${recipeId}`),
  create: (recipeData) => api.post("/api/v1/recipes", recipeData),
  update: (recipeId, recipeData) => api.put(`/api/v1/recipes/${recipeId}`, recipeData),
  remove: (recipeId) => api.del(`/api/v1/recipes/${recipeId}`),
  uploadImage: (recipeId, file) => api.uploadFile(`/api/v1/recipes/${recipeId}/image`, file),
  addFavorite: (recipeId) => api.post(`/api/v1/recipes/${recipeId}/favorite`),
  removeFavorite: (recipeId) => api.del(`/api/v1/recipes/${recipeId}/favorite`),
  listCategories: () => api.get("/api/v1/categories"),
  listIngredients: (query = "") => api.get(`/api/v1/ingredients${query ? `?q=${encodeURIComponent(query)}` : ""}`),
};

export default recipeService;
