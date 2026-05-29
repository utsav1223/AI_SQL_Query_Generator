import { createRequest } from "./httpClient";
import { getClerkToken } from "./clerkToken";

export const adminApiRequest = createRequest({ getToken: getClerkToken, authScope: "admin" });
