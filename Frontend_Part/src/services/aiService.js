import { apiRequest } from "./api";

export const aiService = {
  runTool(payload) {
    return apiRequest("/ai", "POST", payload);
  }
};
