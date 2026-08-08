import { beforeEach, describe, expect, it, vi } from "vitest";

import recipeService from "./recipeService";
import { setupApi, jsonResponse } from "../test/helpers";

beforeEach(() => setupApi());

function urlOf(call) {
  return call[0];
}

describe("recipeService.list (query string)", () => {
  it("usa page y size por defecto sin filtros", async () => {
    global.fetch = vi.fn(() => jsonResponse({ items: [] }));

    await recipeService.list();

    expect(urlOf(global.fetch.mock.calls[0])).toBe("http://test/api/v1/recipes?page=1&size=20");
  });

  it("mapea los filtros camelCase a snake_case y omite los vacíos", async () => {
    global.fetch = vi.fn(() => jsonResponse({ items: [] }));

    await recipeService.list({ q: "pollo", categoryId: 3, timeMax: 30, favoritesOnly: true, difficulty: "" });

    const url = urlOf(global.fetch.mock.calls[0]);
    expect(url).toContain("q=pollo");
    expect(url).toContain("category_id=3");
    expect(url).toContain("time_max=30");
    expect(url).toContain("favorites_only=true");
    expect(url).not.toContain("difficulty="); // vacío → se omite
  });

  it("favoritesOnly=false no añade el parámetro", async () => {
    global.fetch = vi.fn(() => jsonResponse({ items: [] }));

    await recipeService.list({ favoritesOnly: false });

    expect(urlOf(global.fetch.mock.calls[0])).not.toContain("favorites_only");
  });
});

describe("recipeService endpoints", () => {
  it("get pide la receta por id", async () => {
    global.fetch = vi.fn(() => jsonResponse({ id: 5 }));
    await recipeService.get(5);
    expect(urlOf(global.fetch.mock.calls[0])).toBe("http://test/api/v1/recipes/5");
  });

  it("create hace POST con el cuerpo de la receta", async () => {
    global.fetch = vi.fn(() => jsonResponse({ id: 1 }));
    await recipeService.create({ title: "Tortilla" });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://test/api/v1/recipes");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ title: "Tortilla" });
  });

  it("addFavorite y removeFavorite usan el sub-recurso /favorite", async () => {
    global.fetch = vi.fn(() => jsonResponse({}));
    await recipeService.addFavorite(9);
    expect(global.fetch.mock.calls[0][0]).toBe("http://test/api/v1/recipes/9/favorite");
    expect(global.fetch.mock.calls[0][1].method).toBe("POST");

    await recipeService.removeFavorite(9);
    expect(global.fetch.mock.calls[1][1].method).toBe("DELETE");
  });

  it("listIngredients codifica la query de búsqueda", async () => {
    global.fetch = vi.fn(() => jsonResponse([]));
    await recipeService.listIngredients("aceite de oliva");
    expect(urlOf(global.fetch.mock.calls[0])).toBe("http://test/api/v1/ingredients?q=aceite%20de%20oliva");
  });
});
