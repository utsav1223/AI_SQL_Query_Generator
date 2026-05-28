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

  it("updates Pro query organization metadata", () => {
    queryService.toggleFavorite("query-1");
    queryService.updateTags("query-1", ["billing", "reporting"]);
    queryService.trackAction("query-1", "copy");

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/queries/query-1/favorite", "PATCH");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/queries/query-1/tags", "PATCH", {
      tags: ["billing", "reporting"]
    });
    expect(apiRequest).toHaveBeenNthCalledWith(
      3,
      "/queries/query-1/action",
      "POST",
      { action: "copy" },
      { notifyOnAuthError: false }
    );
  });
});
