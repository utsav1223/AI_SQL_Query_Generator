import { apiRequest } from "./api";

export const authService = {
  logout() {
    return apiRequest("/auth/logout", "POST");
  },
  getCurrentUser(token = undefined) {
    return apiRequest("/auth/me", "GET", null, {
      token,
      notifyOnAuthError: false
    });
  },
  submitAccessAppeal(payload) {
    return apiRequest("/auth/access-appeal", "POST", payload, {
      notifyOnAuthError: false
    });
  }
};
