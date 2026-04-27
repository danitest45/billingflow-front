import { apiRequest } from "./api";
import { buildQueryString } from "./query";
import type { Invoice, InvoiceListParams, PaginatedResponse } from "../types/domain";

export const invoicesService = {
  list(params: InvoiceListParams) {
    return apiRequest<PaginatedResponse<Invoice>>(`/api/invoices${buildQueryString(params)}`);
  },
  generateInvoice(clientId: string) {
    return apiRequest<Invoice>(`/api/invoices/generate/${clientId}`, {
      method: "POST"
    });
  },
  replaceInvoice(clientId: string) {
    return apiRequest<Invoice>(`/api/invoices/replace/${clientId}`, {
      method: "POST"
    });
  },
  deleteInvoice(invoiceId: string) {
    return apiRequest<{ message: string }>(`/api/invoices/${invoiceId}`, {
      method: "DELETE"
    });
  },
  markAsPaid(id: string) {
    return apiRequest<void>(`/api/invoices/${id}/pay`, {
      method: "PATCH"
    });
  }
};
