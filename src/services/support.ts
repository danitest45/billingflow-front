import { apiRequest } from "./api";
import type { ApiMessageResponse, SupportPayload } from "../types/domain";

export const supportService = {
  sendSupportMessage(payload: SupportPayload) {
    return apiRequest<ApiMessageResponse>("/api/support", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify(payload)
    });
  }
};
