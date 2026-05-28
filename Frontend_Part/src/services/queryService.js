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
  toggleFavorite(id) {
    return apiRequest(`/queries/${id}/favorite`, "PATCH");
  },
  updateTags(id, tags) {
    return apiRequest(`/queries/${id}/tags`, "PATCH", { tags });
  },
  trackAction(id, action) {
    return apiRequest(`/queries/${id}/action`, "POST", { action }, { notifyOnAuthError: false });
  },
  getAdvancedAnalytics() {
    return apiRequest("/queries/advanced-analytics", "GET");
  }
};
