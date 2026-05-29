import { apiRequest } from "./api";

export const notificationService = {
  getNotifications(limit = 8) {
    const query = new URLSearchParams({ limit: String(limit) });
    return apiRequest(`/notifications?${query.toString()}`, "GET");
  },
  markRead(notificationId) {
    return apiRequest(`/notifications/${notificationId}/read`, "PATCH");
  },
  markAllRead() {
    return apiRequest("/notifications/read-all", "PATCH");
  }
};
