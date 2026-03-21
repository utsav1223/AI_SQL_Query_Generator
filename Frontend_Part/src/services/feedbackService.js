import { apiRequest } from "./api";

export const feedbackService = {
  getMyFeedback() {
    return apiRequest("/feedback/mine", "GET");
  },
  submitFeedback(payload) {
    return apiRequest("/feedback", "POST", payload);
  }
};
