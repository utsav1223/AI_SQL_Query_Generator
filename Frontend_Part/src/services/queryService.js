import { apiRequest } from "./api";

export const queryService = {
  getOverview() {
    return apiRequest("/queries/overview", "GET");
  },
  getHistory() {
    return apiRequest("/queries", "GET");
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
