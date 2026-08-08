import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMealPlan } from "./useMealPlan";
import { setupApi, jsonResponse } from "../test/helpers";

beforeEach(() => setupApi());

// La etiqueta de la semana depende de la fecha de hoy, así que enrutamos el
// fetch por método/patrón en vez de por una URL fija.
function mockMealPlan({ getData = { items: [] }, postData = { id: 1 } } = {}) {
  global.fetch = vi.fn((url, opts) => {
    const method = (opts && opts.method) || "GET";
    if (method === "GET") return jsonResponse(getData);
    if (method === "POST") return jsonResponse(postData);
    if (method === "DELETE") return jsonResponse(null, { status: 204 });
    return jsonResponse(null);
  });
}

describe("useMealPlan", () => {
  it("carga las entradas de la semana al montar", async () => {
    mockMealPlan({ getData: { items: [{ id: 1, date: "2026-08-03", meal_type: "comida", recipe_title: "Sopa" }] } });

    const { result } = renderHook(() => useMealPlan());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries).toHaveLength(1);
  });

  it("expone una etiqueta de semana con formato ISO (YYYY-Www)", async () => {
    mockMealPlan();
    const { result } = renderHook(() => useMealPlan());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.weekLabel).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("addEntry añade la entrada devuelta por el backend", async () => {
    mockMealPlan({ postData: { id: 10, date: "2026-08-03", meal_type: "cena", recipe_title: "Curry" } });

    const { result } = renderHook(() => useMealPlan());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addEntry(5, "2026-08-03", "cena");
    });

    expect(result.current.entries.map((e) => e.recipe_title)).toContain("Curry");
  });

  it("goToNextWeek cambia la semana y goToPreviousWeek la restaura", async () => {
    mockMealPlan();
    const { result } = renderHook(() => useMealPlan());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const start = result.current.weekLabel;
    await act(async () => {
      result.current.goToNextWeek();
    });
    expect(result.current.weekLabel).not.toBe(start);

    await act(async () => {
      result.current.goToPreviousWeek();
    });
    expect(result.current.weekLabel).toBe(start);
  });
});
