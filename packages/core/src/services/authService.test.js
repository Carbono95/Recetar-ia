import { beforeEach, describe, expect, it, vi } from "vitest";

import authService from "./authService";
import { setupApi, jsonResponse } from "../test/helpers";

beforeEach(() => setupApi());

describe("authService", () => {
  it("register hace POST con username y password", async () => {
    global.fetch = vi.fn(() => jsonResponse({ user: {}, tokens: {} }));
    await authService.register("ana", "secreta123");
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://test/api/v1/auth/register");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ username: "ana", password: "secreta123" });
  });

  it("login hace POST a /auth/login", async () => {
    global.fetch = vi.fn(() => jsonResponse({ access_token: "a", refresh_token: "r" }));
    await authService.login("ana", "secreta123");
    expect(global.fetch.mock.calls[0][0]).toBe("http://test/api/v1/auth/login");
  });

  it("refresh envía el refresh_token en el cuerpo", async () => {
    global.fetch = vi.fn(() => jsonResponse({ access_token: "a" }));
    await authService.refresh("mi-refresh");
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ refresh_token: "mi-refresh" });
  });

  it("me hace GET a /auth/me", async () => {
    global.fetch = vi.fn(() => jsonResponse({ id: 1, username: "ana" }));
    const profile = await authService.me();
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://test/api/v1/auth/me");
    expect(opts.method).toBe("GET");
    expect(profile.username).toBe("ana");
  });
});
