import { apiRequest } from "./api";
import type { BillingRedirectSessionResponse, SubscriptionUpgradePlanType } from "../types/domain";

export const billingService = {
  createCheckoutSession(planType: SubscriptionUpgradePlanType) {
    return apiRequest<BillingRedirectSessionResponse>("/api/billing/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ planType })
    });
  },
  createCustomerPortalSession() {
    return apiRequest<BillingRedirectSessionResponse>("/api/billing/create-customer-portal-session", {
      method: "POST"
    });
  },
  createSubscriptionUpdatePortalSession() {
    return apiRequest<BillingRedirectSessionResponse>("/api/billing/create-subscription-update-portal-session", {
      method: "POST"
    });
  }
};
