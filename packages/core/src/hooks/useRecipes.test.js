import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRecipes } from "./useRecipes";
import { setNotifier } from "../notify";
import { mockApi, setupApi } from "../test/helpers";

const LIST = "http://test/api/v1/recipes?page=1&size=20";

beforeEach(() => setupApi());

describe("useRecipes", () => {
  it("carga las recetas de data.items al montar", async () => {
    mockApi({ [`GET ${LIST}`]: { data: { items: [{ id: 1, title: "A", is_favorite: false }] } } });

    const { result } = renderHook(() => useRecipes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.recipes).toHaveLength(1);
  });

  it("toggleFavorite actualiza el favorito de forma optimista", async () => {
    mockApi({
      [`GET ${LIST}`]: { data: { items: [{ id: 1, title: "A", is_favorite: false }] } },
      [`POST http://test/api/v1/recipes/1/favorite`]: { data: { id: 1, is_favorite: true } },
    });

    const { result } = renderHook(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    await act(async () => {
      await result.current.toggleFavorite(1, true);
    });

    expect(result.current.recipes[0].is_favorite).toBe(true);
  });

  it("toggleFavorite revierte y avisa si el backend falla", async () => {
    const notify = vi.fn();
    setNotifier(notify);
    mockApi({
      [`GET ${LIST}`]: { data: { items: [{ id: 1, title: "A", is_favorite: false }] } },
      [`POST http://test/api/v1/recipes/1/favorite`]: { ok: false, status: 500, data: { detail: "boom" } },
    });

    const { result } = renderHook(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    await act(async () => {
      await result.current.toggleFavorite(1, true);
    });

    expect(result.current.recipes[0].is_favorite).toBe(false); // revertido
    expect(notify).toHaveBeenCalled();
  });

  it("deleteRecipe quita la receta de la lista", async () => {
    mockApi({
      [`GET ${LIST}`]: { data: { items: [{ id: 1, title: "A" }, { id: 2, title: "B" }] } },
      [`DELETE http://test/api/v1/recipes/1`]: { status: 204, data: null },
    });

    const { result } = renderHook(() => useRecipes());
    await waitFor(() => expect(result.current.recipes).toHaveLength(2));

    await act(async () => {
      await result.current.deleteRecipe(1);
    });

    expect(result.current.recipes.map((r) => r.id)).toEqual([2]);
  });
});
