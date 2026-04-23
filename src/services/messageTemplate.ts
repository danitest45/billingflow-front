import { apiRequest } from "./api";
import type { MessageTemplate, WhatsAppPreview } from "../types/domain";

export const messageTemplateService = {
  getCurrent() {
    return apiRequest<MessageTemplate>("/api/messagetemplate");
  },
  update(payload: MessageTemplate) {
    return apiRequest<MessageTemplate>("/api/messagetemplate", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  getWhatsAppPreview(invoiceId: string) {
    return apiRequest<WhatsAppPreview>(`/api/messagetemplate/whatsapp-preview/${invoiceId}`);
  }
};
