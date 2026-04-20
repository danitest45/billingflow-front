import { apiRequest } from "./api";
import type { SubscriptionInfo } from "../types/domain";

export const subscriptionService = {
  getDetails() {
    return apiRequest<SubscriptionInfo>("/api/subscription");
  }
};
