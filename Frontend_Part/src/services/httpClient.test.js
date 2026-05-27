import { afterEach, describe, expect, it, vi } from "vitest";
import { API_AUTH_EVENT, createRequest } from "./httpClient";

describe("httpClient auth events", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatches a scoped auth event for protected 401 responses", async () => {
    const listener = vi.fn();
    window.addEventListener(API_AUTH_EVENT, listener);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Session expired" })
    });

    const request = createRequest({ authScope: "user" });

    await expect(request("/queries", "GET")).rejects.toMatchObject({ status: 401 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toMatchObject({
      authScope: "user",
      endpoint: "/queries",
      status: 401
    });

    window.removeEventListener(API_AUTH_EVENT, listener);
  });

  it("does not dispatch auth events for public login failures", async () => {
    const listener = vi.fn();
    window.addEventListener(API_AUTH_EVENT, listener);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid credentials" })
    });

    const request = createRequest({ authScope: "user" });

    await expect(request("/auth/login", "POST", { email: "a@b.com" })).rejects.toMatchObject({ status: 401 });
    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener(API_AUTH_EVENT, listener);
  });
});
