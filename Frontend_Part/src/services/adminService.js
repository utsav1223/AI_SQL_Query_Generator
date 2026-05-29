import { adminApiRequest } from "./adminApi";

export const adminService = {
  login(credentials) {
    return adminApiRequest("/admin/login", "POST", credentials);
  },
  logout() {
    return adminApiRequest("/admin/logout", "POST");
  },
  getCurrentAdmin() {
    return adminApiRequest("/admin/me", "GET");
  },
  getOverview() {
    return adminApiRequest("/admin/overview", "GET");
  },
  getUsers(queryString = "") {
    return adminApiRequest(`/admin/users${queryString ? `?${queryString}` : ""}`, "GET");
  },
  getFeedback(queryString = "") {
    return adminApiRequest(`/admin/feedback${queryString ? `?${queryString}` : ""}`, "GET");
  },
  getAccessAppeals(queryString = "") {
    return adminApiRequest(`/admin/access-appeals${queryString ? `?${queryString}` : ""}`, "GET");
  },
  moderateUser(userId, payload) {
    return adminApiRequest(`/admin/users/${userId}/moderate`, "POST", payload);
  },
  updateAccessAppealStatus(appealId, payload) {
    return adminApiRequest(`/admin/access-appeals/${appealId}/status`, "PATCH", payload);
  },
  updateFeedbackStatus(feedbackId, payload) {
    return adminApiRequest(`/admin/feedback/${feedbackId}/status`, "PATCH", payload);
  },
  updateSecurityEventStatus(eventId, payload) {
    return adminApiRequest(`/admin/security-events/${eventId}/status`, "PATCH", payload);
  }
};
