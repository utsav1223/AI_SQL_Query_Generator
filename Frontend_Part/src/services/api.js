import { createRequest } from "./httpClient";

export const apiRequest = createRequest({ authScope: "user" });
