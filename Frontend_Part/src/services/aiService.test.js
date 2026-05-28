import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
  apiRequest: vi.fn()
}));

const { apiRequest } = await import("./api");
const { AI_REQUEST_TIMEOUT_MS, aiService } = await import("./aiService");

describe("aiService", () => {
  beforeEach(() => {
    apiRequest.mockReset();
  });

  it("uses an extended timeout for long-running AI requests", () => {
    const payload = { mode: "generate", prompt: "show monthly orders" };

    aiService.runTool(payload);

    expect(apiRequest).toHaveBeenCalledWith("/ai", "POST", payload, {
      timeoutMs: AI_REQUEST_TIMEOUT_MS
    });
  });
});
