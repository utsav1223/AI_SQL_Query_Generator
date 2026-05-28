import { apiRequest } from "./api";

export const AI_REQUEST_TIMEOUT_MS = 120000;

export const aiService = {
  runTool(payload) {
    return apiRequest("/ai", "POST", payload, { timeoutMs: AI_REQUEST_TIMEOUT_MS });
  }
};
