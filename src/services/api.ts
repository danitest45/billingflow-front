import { branding } from "../config/branding";
import type {
  ApiMessageResponse,
  AuthSession,
  DashboardSummary,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload
} from "../types/domain";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "https://localhost:44323";
const STORAGE_KEY = "billingflow:session";
const DEFAULT_ERROR_MESSAGE = "Nao foi possivel processar sua solicitacao agora. Tente novamente em instantes.";

type RequestOptions = RequestInit & {
  requiresAuth?: boolean;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function getStoredSession() {
  const rawSession = localStorage.getItem(STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function isTechnicalMessage(message: string) {
  const normalized = message.trim().toLowerCase();

  return (
    !normalized ||
    normalized === "[object object]" ||
    normalized.includes("typeerror") ||
    normalized.includes("syntaxerror") ||
    normalized.includes("referenceerror") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("<!doctype") ||
    normalized.includes("<html") ||
    normalized.includes("stack") ||
    normalized.includes(" at ")
  );
}

function sanitizeComparableMessage(message: string) {
  return message
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function mapBusinessErrorMessage(message: string) {
  const normalized = sanitizeComparableMessage(message);

  if (normalized === "invoice_already_paid") {
    return "Esta cobrança já foi paga e não pode ser alterada ou excluída.";
  }

  if (normalized === "invoice_already_exists") {
    return "Já existe uma cobrança para este cliente no mês atual.";
  }

  if (normalized.includes("ja existe cobranca para este cliente no mes atual")) {
    return "Ja existe uma cobranca gerada para este cliente neste mes.";
  }

  if (
    normalized.includes("senha invalida") ||
    normalized.includes("usuario invalido") ||
    normalized.includes("usuario ou senha invalido") ||
    normalized.includes("usuario nao encontrado")
  ) {
    return "Nao encontramos uma conta com esse e-mail e senha. Confira os dados e tente novamente.";
  }

  return message;
}

export function normalizeErrorMessage(value: unknown, fallback = DEFAULT_ERROR_MESSAGE): string {
  if (typeof value === "string") {
    const message = value.trim();
    return isTechnicalMessage(message) ? fallback : mapBusinessErrorMessage(message);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = normalizeErrorMessage(item, "");
      if (message) {
        return message;
      }
    }

    return fallback;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    const directMessage = normalizeErrorMessage(
      record.message ?? record.error ?? record.detail ?? record.title,
      ""
    );
    if (directMessage) {
      return directMessage;
    }

    if (record.errors && typeof record.errors === "object") {
      const nestedErrors = Object.values(record.errors as Record<string, unknown>);
      const nestedMessage = normalizeErrorMessage(nestedErrors, "");
      if (nestedMessage) {
        return nestedMessage;
      }
    }

    const codeMessage = normalizeErrorMessage(record.code, "");
    if (codeMessage) {
      return codeMessage;
    }
  }

  return fallback;
}

async function parseErrorResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = await response.json();
    const code =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>).code
        : undefined;

    return {
      code: typeof code === "string" ? code : undefined,
      message: normalizeErrorMessage(payload)
    };
  }

  const text = await response.text();
  return {
    message: normalizeErrorMessage(text)
  };
}

export function getErrorMessage(error: unknown, fallback = DEFAULT_ERROR_MESSAGE) {
  if (error instanceof ApiError) {
    return normalizeErrorMessage(error.message, fallback);
  }

  if (error instanceof Error) {
    return normalizeErrorMessage(error.message, fallback);
  }

  return fallback;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { requiresAuth = true, headers, ...rest } = options;
  const session = getStoredSession();
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && rest.body) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (requiresAuth && session?.token) {
    requestHeaders.set("Authorization", `Bearer ${session.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders
    });
  } catch {
    throw new ApiError(`Nao foi possivel conectar ao ${branding.productName} agora. Tente novamente em instantes.`, 0);
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }

    const errorPayload = await parseErrorResponse(response);
    throw new ApiError(errorPayload.message, response.status, errorPayload.code);
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  const text = await response.text();

  if (!text.trim()) {
    return null as T;
  }

  return text as T;
}

export const authService = {
  login(payload: LoginPayload) {
    return apiRequest<AuthSession>("/api/auth/login", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify(payload)
    });
  },
  register(payload: RegisterPayload) {
    return apiRequest<AuthSession>("/api/auth/register", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify(payload)
    });
  },
  forgotPassword(payload: ForgotPasswordPayload) {
    return apiRequest<ApiMessageResponse>("/api/auth/forgot-password", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify(payload)
    });
  },
  resetPassword(payload: ResetPasswordPayload) {
    return apiRequest<ApiMessageResponse>("/api/auth/reset-password", {
      method: "POST",
      requiresAuth: false,
      body: JSON.stringify(payload)
    });
  }
};

export const dashboardService = {
  getSummary() {
    return apiRequest<DashboardSummary>("/api/dashboard/summary");
  }
};
