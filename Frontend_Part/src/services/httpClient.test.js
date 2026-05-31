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

  it("does not dispatch auth events for admin login failures", async () => {
    const listener = vi.fn();
    window.addEventListener(API_AUTH_EVENT, listener);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid credentials" })
    });

    const request = createRequest({ authScope: "user" });

    await expect(request("/admin/login", "POST", { userId: "admin" })).rejects.toMatchObject({ status: 401 });
    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener(API_AUTH_EVENT, listener);
  });

  it("dispatches account restriction details for blocked users", async () => {
    const listener = vi.fn();
    window.addEventListener(API_AUTH_EVENT, listener);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        message: "Your account has been suspended. Reason: Policy violation",
        data: {
          code: "ACCOUNT_SUSPENDED",
          accountRestriction: {
            status: "suspended",
            reason: "Policy violation"
          }
        }
      })
    });

    const request = createRequest({ authScope: "user" });

    await expect(request("/auth/me", "GET")).rejects.toMatchObject({ status: 403 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toMatchObject({
      authScope: "user",
      code: "ACCOUNT_SUSPENDED",
      accountRestriction: {
        status: "suspended",
        reason: "Policy violation"
      }
    });

    window.removeEventListener(API_AUTH_EVENT, listener);
  });

  it("uses the request timeout override when provided", async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { result: "select 1;" } })
    });

    const request = createRequest({ authScope: "user" });

    await request("/ai", "POST", { prompt: "select one" }, { timeoutMs: 120000 });

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 120000);
  });

  it("does not send JSON content headers for bodyless requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: "admin" } })
    });

    const request = createRequest({ authScope: "admin" });

    await request("/admin/me", "GET");

    expect(fetchSpy.mock.calls[0][1].headers).not.toHaveProperty("Content-Type");
  });
});
