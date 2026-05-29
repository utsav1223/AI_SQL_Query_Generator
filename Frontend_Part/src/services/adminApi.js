import { createRequest } from "./httpClient";
import { getClerkToken } from "./clerkToken";
import { STORAGE_KEYS, readJson } from "../utils/storage";

const getAdminToken = async () => {
  const passwordAdminToken = readJson(STORAGE_KEYS.adminToken);

  if (passwordAdminToken) {
    return passwordAdminToken;
  }

  return getClerkToken();
};

export const adminApiRequest = createRequest({ getToken: getAdminToken, authScope: "admin" });
