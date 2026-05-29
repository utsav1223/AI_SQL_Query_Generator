import { createRequest } from "./httpClient";
import { getClerkToken } from "./clerkToken";

export const apiRequest = createRequest({ getToken: getClerkToken, authScope: "user" });
