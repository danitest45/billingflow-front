import { apiRequest } from "./api";
import { buildQueryString } from "./query";
import type { Client, ClientListParams, ClientPayload, PaginatedResponse } from "../types/domain";

export const clientsService = {
  list(params: ClientListParams) {
    return apiRequest<PaginatedResponse<Client>>(`/api/clients${buildQueryString(params)}`);
  },
  create(payload: ClientPayload) {
    return apiRequest<Client>("/api/clients", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  update(id: string, payload: ClientPayload) {
    return apiRequest<Client>(`/api/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/api/clients/${id}`, {
      method: "DELETE"
    });
  }
};
