import { createRequest } from "./httpClient";
import { STORAGE_KEYS } from "../utils/storage";

export const apiRequest = createRequest({
  getToken: () => localStorage.getItem(STORAGE_KEYS.token)
});
