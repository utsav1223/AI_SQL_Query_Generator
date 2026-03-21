import { apiRequest } from "./api";

export const authService = {
  login(credentials) {
    return apiRequest("/auth/login", "POST", credentials);
  },
  register(payload) {
    return apiRequest("/auth/register", "POST", payload);
  },
  forgotPassword(email) {
    return apiRequest("/auth/forgot-password", "POST", { email });
  },
  verifyOtpAndReset(payload) {
    return apiRequest("/auth/verify-otp", "POST", payload);
  },
  getCurrentUser() {
    return apiRequest("/auth/me", "GET");
  },
  updateProfile(payload) {
    return apiRequest("/auth/update-profile", "PUT", payload);
  },
  changePassword(payload) {
    return apiRequest("/auth/change-password", "PUT", payload);
  },
  deleteAccount() {
    return apiRequest("/auth/delete-account", "DELETE");
  }
};
