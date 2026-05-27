import { createRequest } from "./httpClient";

export const adminApiRequest = createRequest({ authScope: "admin" });
