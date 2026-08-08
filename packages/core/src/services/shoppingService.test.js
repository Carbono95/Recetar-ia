import { beforeEach, describe, expect, it, vi } from "vitest";

import shoppingService from "./shoppingService";
import { setupApi } from "../test/helpers";

beforeEach(() => setupApi());

describe("shoppingService", () => {
  it("addItem hace POST a /shopping/items con el cuerpo mapeado a snake_case", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1, ingredient_name: "Pan", source: "manual" }) });

    const result = await shoppingService.addItem({ ingredientName: "Pan" });

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://test/api/v1/shopping/items");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ ingredient_name: "Pan", total_quantity: "", unit: null });
    expect(result.source).toBe("manual");
  });

  it("removeItem hace DELETE con el id en la URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => null });

    await shoppingService.removeItem(7);

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://test/api/v1/shopping/7");
    expect(opts.method).toBe("DELETE");
  });

  it("generate envía los recipe_ids en el cuerpo", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [] }) });

    await shoppingService.generate([1, 2]);

    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ recipe_ids: [1, 2] });
  });

  it("propaga el detail del backend como Error en las respuestas no ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ detail: "mal" }) });

    await expect(shoppingService.get()).rejects.toThrow("mal");
  });
});
