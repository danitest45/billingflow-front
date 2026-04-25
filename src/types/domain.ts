export type DashboardSummary = {
  totalExpected: number;
  totalPaid: number;
  totalPending: number;
  overdueCount: number;
};

export type AuthSession = {
  token: string;
  userId: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type ApiMessageResponse = {
  message: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  monthlyAmount: number;
  dueDay: number;
};

export type ClientPayload = Omit<Client, "id">;

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type ClientListParams = {
  search?: string;
  dueDay?: number;
  minMonthlyAmount?: number;
  maxMonthlyAmount?: number;
  page?: number;
  pageSize?: number;
};

export type InvoiceStatus = "paid" | "pending" | "overdue";

export type Invoice = {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status?: unknown;
  paidAt?: string | null;
};

export type InvoiceListParams = {
  clientName?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

export type SubscriptionPlan = "Trial" | "Starter" | "Pro" | "Agency";

export type SubscriptionStatus = "Trialing" | "Active" | "Expired" | "Canceled";

export type SubscriptionInfo = {
  plan: SubscriptionPlan;
  maxClients: number;
  currentClients: number;
  endsAt: string | null;
  status: SubscriptionStatus;
};

export type SubscriptionUpgradePlanType = 2 | 3 | 4;

export type BillingRedirectSessionResponse = {
  url: string;
};

export type MessageTemplate = {
  chargeTemplate: string;
};

export type WhatsAppPreview = {
  phone: string;
  message: string;
  whatsAppUrl: string;
};
