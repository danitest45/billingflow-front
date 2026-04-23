import type { InvoiceStatus, SubscriptionPlan, SubscriptionStatus } from "../types/domain";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value ?? 0);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function hasPaidAt(value?: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function getNestedStatusCandidate(value: object) {
  if ("status" in value) {
    return (value as { status?: unknown }).status;
  }

  if ("name" in value) {
    return (value as { name?: unknown }).name;
  }

  if ("label" in value) {
    return (value as { label?: unknown }).label;
  }

  if ("value" in value) {
    return (value as { value?: unknown }).value;
  }

  return "";
}

export function normalizeInvoiceStatus(value?: unknown): InvoiceStatus {
  if (typeof value === "number") {
    if (value === 1) {
      return "pending";
    }

    if (value === 2) {
      return "paid";
    }

    if (value === 3) {
      return "overdue";
    }

    return "pending";
  }

  if (typeof value === "boolean") {
    return value ? "paid" : "pending";
  }

  if (value && typeof value === "object") {
    return normalizeInvoiceStatus(getNestedStatusCandidate(value));
  }

  const normalized = String(value ?? "").trim().toLowerCase();

  if (
    ["2", "paid", "pago", "paidout", "settled"].includes(normalized) ||
    normalized.includes("paid") ||
    normalized.includes("pago")
  ) {
    return "paid";
  }

  if (
    ["3", "overdue", "atrasado", "late", "vencido"].includes(normalized) ||
    normalized.includes("over") ||
    normalized.includes("atras") ||
    normalized.includes("venc")
  ) {
    return "overdue";
  }

  if (["1", "pending", "pendente", "open", "aberto"].includes(normalized)) {
    return "pending";
  }

  return "pending";
}

export function resolveInvoiceStatus(status?: unknown, paidAt?: string | null): InvoiceStatus {
  if (hasPaidAt(paidAt)) {
    return "paid";
  }

  return normalizeInvoiceStatus(status);
}

export function formatSubscriptionPlan(plan?: SubscriptionPlan | string | null) {
  const normalized = String(plan ?? "").trim().toLowerCase();

  if (normalized === "trial") {
    return "Trial";
  }

  if (normalized === "starter") {
    return "Starter";
  }

  if (normalized === "pro") {
    return "Pro";
  }

  if (normalized === "agency") {
    return "Agency";
  }

  return "Plano indisponivel";
}

export function formatSubscriptionStatus(status?: SubscriptionStatus | string | null) {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (normalized === "trialing") {
    return "Periodo de teste";
  }

  if (normalized === "active") {
    return "Ativo";
  }

  if (normalized === "expired") {
    return "Expirado";
  }

  if (normalized === "canceled") {
    return "Cancelado";
  }

  return "Status indisponivel";
}

export function isSubscriptionInactive(status?: SubscriptionStatus | string | null) {
  const normalized = String(status ?? "").trim().toLowerCase();
  return normalized === "expired" || normalized === "canceled";
}

export function isSubscriptionCurrent(status?: SubscriptionStatus | string | null) {
  const normalized = String(status ?? "").trim().toLowerCase();
  return normalized === "active" || normalized === "trialing";
}

export function isTrialPlan(plan?: SubscriptionPlan | string | null) {
  const normalized = String(plan ?? "").trim().toLowerCase();
  return normalized === "trial";
}

export function canUseWhatsApp(plan?: SubscriptionPlan | string | null) {
  const normalized = String(plan ?? "").trim().toLowerCase();
  return normalized === "starter" || normalized === "pro" || normalized === "agency";
}

export function getSubscriptionStatusTone(status?: SubscriptionStatus | string | null) {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (normalized === "trialing") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "expired") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "canceled") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}
