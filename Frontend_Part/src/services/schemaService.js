import { apiRequest } from "./api";

export const schemaService = {
  getSchema() {
    return apiRequest("/schema", "GET");
  },
  saveSchema(schemaText) {
    return apiRequest("/schema", "POST", { schemaText });
  },
  deleteSchema() {
    return apiRequest("/schema", "DELETE");
  }
};
