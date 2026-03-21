import { createRequest } from "./httpClient";
import { STORAGE_KEYS } from "../utils/storage";

export const adminApiRequest = createRequest({
  getToken: () => localStorage.getItem(STORAGE_KEYS.adminToken)
});
