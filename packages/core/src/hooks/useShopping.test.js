import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useShopping } from "./useShopping";
import { setNotifier } from "../notify";
import { mockApi, setupApi } from "../test/helpers";

const BASE = "http://test/api/v1/shopping";

beforeEach(() => setupApi());

describe("useShopping", () => {
  it("carga la lista al montar", async () => {
    mockApi({ [`GET ${BASE}`]: { data: { items: [{ id: 1, ingredient_name: "Pan", checked: false }] } } });

    const { result } = renderHook(() => useShopping());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
  });

  it("addItem añade el artículo devuelto por el backend", async () => {
    mockApi({
      [`GET ${BASE}`]: { data: { items: [] } },
      [`POST ${BASE}/items`]: { status: 201, data: { id: 9, ingredient_name: "Detergente", source: "manual" } },
    });

    const { result } = renderHook(() => useShopping());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addItem("Detergente");
    });

    expect(result.current.items.map((i) => i.ingredient_name)).toContain("Detergente");
  });

  it("removeItem quita el ítem de forma optimista", async () => {
    mockApi({
      [`GET ${BASE}`]: { data: { items: [{ id: 1, ingredient_name: "Pan" }, { id: 2, ingredient_name: "Leche" }] } },
      [`DELETE ${BASE}/1`]: { status: 204, data: null },
    });

    const { result } = renderHook(() => useShopping());
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(async () => {
      await result.current.removeItem(1);
    });

    expect(result.current.items.map((i) => i.id)).toEqual([2]);
  });

  it("removeItem revierte el borrado y avisa si el backend falla", async () => {
    const notify = vi.fn();
    setNotifier(notify);
    mockApi({
      [`GET ${BASE}`]: { data: { items: [{ id: 1, ingredient_name: "Pan" }] } },
      [`DELETE ${BASE}/1`]: { ok: false, status: 500, data: { detail: "boom" } },
    });

    const { result } = renderHook(() => useShopping());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      await result.current.removeItem(1);
    });

    expect(result.current.items).toHaveLength(1); // se restaura
    expect(notify).toHaveBeenCalled();
  });
});
