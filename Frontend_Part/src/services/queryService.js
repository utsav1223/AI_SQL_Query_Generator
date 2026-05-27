import { apiRequest } from "./api";

export const queryService = {
  getOverview() {
    return apiRequest("/queries/overview", "GET");
  },
  getHistory(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, value);
      }
    });

    return apiRequest(`/queries${query.toString() ? `?${query.toString()}` : ""}`, "GET");
  },
  deleteQuery(id) {
    return apiRequest(`/queries/${id}`, "DELETE");
  },
  togglePin(id) {
    return apiRequest(`/queries/${id}/pin`, "PATCH");
  },
  getAdvancedAnalytics() {
    return apiRequest("/queries/advanced-analytics", "GET");
  }
};
