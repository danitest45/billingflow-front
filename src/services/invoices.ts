import { apiRequest } from "./api";
import { buildQueryString } from "./query";
import type { Invoice, InvoiceListParams, PaginatedResponse } from "../types/domain";

export const invoicesService = {
  list(params: InvoiceListParams) {
    return apiRequest<PaginatedResponse<Invoice>>(`/api/invoices${buildQueryString(params)}`);
  },
  generate(clientId: string) {
    return apiRequest<Invoice>(`/api/invoices/generate/${clientId}`, {
      method: "POST"
    });
  },
  markAsPaid(id: string) {
    return apiRequest<void>(`/api/invoices/${id}/pay`, {
      method: "PATCH"
    });
  }
};
