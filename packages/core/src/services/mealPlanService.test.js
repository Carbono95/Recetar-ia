import { beforeEach, describe, expect, it, vi } from "vitest";

import mealPlanService from "./mealPlanService";
import { setupApi, jsonResponse } from "../test/helpers";

beforeEach(() => setupApi());

describe("mealPlanService", () => {
  it("getWeek pide la semana por su etiqueta", async () => {
    global.fetch = vi.fn(() => jsonResponse({ items: [] }));
    await mealPlanService.getWeek("2026-W32");
    expect(global.fetch.mock.calls[0][0]).toBe("http://test/api/v1/meal-plan?week=2026-W32");
  });

  it("addEntry envía recipe_id, date y meal_type", async () => {
    global.fetch = vi.fn(() => jsonResponse({ id: 1 }));
    await mealPlanService.addEntry(7, "2026-08-03", "cena");
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://test/api/v1/meal-plan");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ recipe_id: 7, date: "2026-08-03", meal_type: "cena" });
  });

  it("removeEntry hace DELETE con el id", async () => {
    global.fetch = vi.fn(() => jsonResponse(null, { status: 204 }));
    await mealPlanService.removeEntry(4);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://test/api/v1/meal-plan/4");
    expect(opts.method).toBe("DELETE");
  });

  it("generateWeeklyShoppingList hace POST con la semana en la query", async () => {
    global.fetch = vi.fn(() => jsonResponse({ items: [] }));
    await mealPlanService.generateWeeklyShoppingList("2026-W32");
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://test/api/v1/meal-plan/generate-shopping?week=2026-W32");
    expect(opts.method).toBe("POST");
  });
});
