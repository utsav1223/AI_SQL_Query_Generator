import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
  apiRequest: vi.fn()
}));

const { apiRequest } = await import("./api");
const { queryService } = await import("./queryService");

describe("queryService", () => {
  beforeEach(() => {
    apiRequest.mockReset();
  });

  it("requests query history without a query string by default", () => {
    queryService.getHistory();

    expect(apiRequest).toHaveBeenCalledWith("/queries", "GET");
  });

  it("builds a paginated history query string", () => {
    queryService.getHistory({
      page: 2,
      limit: 10,
      mode: "generate",
      search: "orders by month",
      sort: "oldest"
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/queries?page=2&limit=10&mode=generate&search=orders+by+month&sort=oldest",
      "GET"
    );
  });
});
