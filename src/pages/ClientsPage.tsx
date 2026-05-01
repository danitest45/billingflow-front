import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertBanner } from "../components/common/AlertBanner";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { PageHeader } from "../components/common/PageHeader";
import { PaginationControls } from "../components/common/PaginationControls";
import { Select } from "../components/common/Select";
import { StatusBadge } from "../components/common/StatusBadge";
import { WhatsAppUpgradeModal } from "../components/subscription/WhatsAppUpgradeModal";
import { branding } from "../config/branding";
import { useApiFeedback } from "../hooks/useApiFeedback";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { ApiError, getErrorMessage } from "../services/api";
import { clientsService } from "../services/clients";
import { invoicesService } from "../services/invoices";
import { messageTemplateService } from "../services/messageTemplate";
import { subscriptionService } from "../services/subscription";
import type {
  BillingCycle,
  Client,
  ClientBillingSummary,
  ClientListParams,
  ClientPayload,
  InvoiceSummary,
  PaginatedResponse,
  SubscriptionInfo
} from "../types/domain";
import {
  canUseWhatsApp,
  formatDate,
  formatCurrency,
  formatSubscriptionPlan,
  formatSubscriptionStatus,
  getSubscriptionStatusTone,
  isSubscriptionInactive,
  resolveInvoiceStatus
} from "../utils/format";
import { formatCurrencyBRL, formatPhone, parseCurrencyBRL, unmaskPhone } from "../utils/clientForm";

type ClientModalMode = "create" | "edit";
type ClientRowAction = "generate" | "delete";
type ClientBillingAction = "generate" | "pay" | "whatsapp";
type ClientFormValues = {
  name: string;
  email: string;
  phone: string;
  monthlyAmount: string;
  dueDay: string;
  billingCycle: string;
  billingStartDate: string;
};
type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;
type ClientFilterForm = {
  search: string;
  dueDay: string;
  minMonthlyAmount: string;
  maxMonthlyAmount: string;
};

const DEFAULT_PAGE_SIZE = 10;
const BILLING_CYCLE_OPTIONS: Array<{ value: BillingCycle; label: string }> = [
  { value: 1, label: "Mensal" },
  { value: 2, label: "Trimestral" },
  { value: 3, label: "Semestral" },
  { value: 4, label: "Anual" }
];

function getTodayDateInput() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDateInput(value?: string | null) {
  if (!value) {
    return getTodayDateInput();
  }

  const datePart = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : getTodayDateInput();
}

function createEmptyForm(): ClientFormValues {
  return {
    name: "",
    email: "",
    phone: "",
    monthlyAmount: "",
    dueDay: "1",
    billingCycle: "1",
    billingStartDate: getTodayDateInput()
  };
}

const emptyFilters: ClientFilterForm = {
  search: "",
  dueDay: "",
  minMonthlyAmount: "",
  maxMonthlyAmount: ""
};

const initialListState: PaginatedResponse<Client> = {
  items: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalCount: 0,
  totalPages: 1
};

function buildClientQuery(filters: ClientFilterForm): ClientListParams {
  return {
    search: filters.search.trim() || undefined,
    dueDay: filters.dueDay ? Number(filters.dueDay) : undefined,
    minMonthlyAmount: filters.minMonthlyAmount ? Number(filters.minMonthlyAmount) : undefined,
    maxMonthlyAmount: filters.maxMonthlyAmount ? Number(filters.maxMonthlyAmount) : undefined
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isBillingCycle(value: number): value is BillingCycle {
  return BILLING_CYCLE_OPTIONS.some((option) => option.value === value);
}

function getBillingCycleLabel(value: number) {
  return BILLING_CYCLE_OPTIONS.find((option) => option.value === value)?.label ?? "Mensal";
}

function getInvoiceClient(invoice: InvoiceSummary) {
  return invoice.clientName || "Cliente nao informado";
}

function MoreIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19.1 4.9A9.6 9.6 0 0 0 3.8 16.2L3 21l4.9-1.3A9.6 9.6 0 0 0 19.1 4.9Z" />
      <path d="M8.8 8.6c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.3.1.5-.1.7l-.4.5c-.1.1-.2.3-.1.5.5 1 1.3 1.8 2.3 2.3.2.1.4 0 .5-.1l.6-.5c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.4.6 0 .6-.4 1.4-1 1.6-.7.3-2 .2-3.7-.7-1.9-1-3.4-2.5-4.3-4.3-.8-1.6-1-2.8-.7-3.5Z" />
    </svg>
  );
}

function isInvoiceAlreadyExistsError(error: unknown) {
  return error instanceof ApiError && error.status === 409 && error.code === "INVOICE_ALREADY_EXISTS";
}

function isInvoiceAlreadyPaidError(error: unknown) {
  return error instanceof ApiError && error.code === "INVOICE_ALREADY_PAID";
}

export function ClientsPage() {
  usePageTitle("Clientes");

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { runWithFeedback } = useApiFeedback();
  const [listState, setListState] = useState<PaginatedResponse<Client>>(initialListState);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [filters, setFilters] = useState<ClientFilterForm>(emptyFilters);
  const [query, setQuery] = useState<ClientListParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE
  });
  const [formData, setFormData] = useState<ClientFormValues>(() => createEmptyForm());
  const [formErrors, setFormErrors] = useState<ClientFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ClientModalMode>("create");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [invoiceConflictTarget, setInvoiceConflictTarget] = useState<Client | null>(null);
  const [isReplacingInvoice, setIsReplacingInvoice] = useState(false);
  const [rowActionState, setRowActionState] = useState<Record<string, ClientRowAction | undefined>>({});
  const [activeMenuClientId, setActiveMenuClientId] = useState<string | null>(null);
  const [billingSummaryTarget, setBillingSummaryTarget] = useState<Client | null>(null);
  const [billingSummary, setBillingSummary] = useState<ClientBillingSummary | null>(null);
  const [isBillingSummaryLoading, setIsBillingSummaryLoading] = useState(false);
  const [billingSummaryError, setBillingSummaryError] = useState("");
  const [billingActionState, setBillingActionState] = useState<ClientBillingAction | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadClients(activeQuery: ClientListParams) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await clientsService.list(activeQuery);
      setListState(response);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Nao foi possivel carregar os clientes."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadClients(query);
  }, [query]);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const response = await subscriptionService.getDetails();
        setSubscription(response);
      } catch {
        setSubscription(null);
      }
    }

    void loadSubscription();
  }, []);

  function updateRowAction(clientId: string, action?: ClientRowAction) {
    setRowActionState((current) => ({
      ...current,
      [clientId]: action
    }));
  }

  function updateFormField<K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function resetFormState() {
    setFormData(createEmptyForm());
    setFormErrors({});
    setSelectedClient(null);
    setModalMode("create");
  }

  function openCreateModal() {
    if (isSubscriptionBlocked) {
      showToast({
        tone: "error",
        title: "Assinatura inativa",
        message: `Sua assinatura esta inativa. Faca upgrade para continuar usando o ${branding.productName}.`
      });
      return;
    }

    if (isClientLimitReached) {
      showToast({
        tone: "info",
        title: "Limite atingido",
        message: "Voce atingiu o limite de clientes do seu plano."
      });
      return;
    }

    resetFormState();
    setErrorMessage("");
    setIsModalOpen(true);
  }

  function openEditModal(client: Client) {
    setModalMode("edit");
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: formatPhone(client.phone),
      monthlyAmount: formatCurrencyBRL(client.monthlyAmount),
      dueDay: String(client.dueDay),
      billingCycle: String(client.billingCycle ?? 1),
      billingStartDate: normalizeDateInput(client.billingStartDate)
    });
    setFormErrors({});
    setErrorMessage("");
    setIsModalOpen(true);
  }

  function refreshCurrentPage() {
    setQuery((current) => ({ ...current }));
  }

  async function refreshSubscription() {
    try {
      const response = await subscriptionService.getDetails();
      setSubscription(response);
    } catch {
      setSubscription(null);
    }
  }

  async function loadClientBillingSummary(clientId: string) {
    setIsBillingSummaryLoading(true);
    setBillingSummaryError("");

    try {
      const response = await clientsService.getClientBillingSummary(clientId);
      setBillingSummary(response);
    } catch (error) {
      setBillingSummary(null);
      setBillingSummaryError(getErrorMessage(error, "Não foi possível carregar as cobranças deste cliente."));
    } finally {
      setIsBillingSummaryLoading(false);
    }
  }

  function openBillingSummary(client: Client) {
    setBillingSummaryTarget(client);
    setBillingSummary(null);
    setBillingSummaryError("");
    setActiveMenuClientId(null);
    void loadClientBillingSummary(client.id);
  }

  function closeBillingSummary() {
    if (billingActionState) {
      return;
    }

    setBillingSummaryTarget(null);
    setBillingSummary(null);
    setBillingSummaryError("");
  }

  async function refreshOpenBillingSummary() {
    const clientId = billingSummary?.client.id ?? billingSummaryTarget?.id;

    if (clientId) {
      await loadClientBillingSummary(clientId);
    }
  }

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery({
      ...buildClientQuery(filters),
      page: 1,
      pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE
    });
  }

  function handleClearFilters() {
    setFilters(emptyFilters);
    setQuery({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE
    });
  }

  async function handleSaveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    const nextErrors: ClientFormErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const parsedPhone = unmaskPhone(formData.phone);
    const parsedMonthlyAmount = parseCurrencyBRL(formData.monthlyAmount);
    const parsedDueDay = Number(formData.dueDay);
    const parsedBillingCycle = Number(formData.billingCycle);
    const billingStartDate = normalizeDateInput(formData.billingStartDate);

    if (!trimmedName) {
      nextErrors.name = "Informe o nome do cliente.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Informe um e-mail.";
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = "Informe um e-mail valido.";
    }

    if (!parsedPhone) {
      nextErrors.phone = "Informe o telefone do cliente.";
    } else if (parsedPhone.length !== 11) {
      nextErrors.phone = "Informe um telefone com DDD e numero completo.";
    }

    if (parsedMonthlyAmount <= 0) {
      nextErrors.monthlyAmount = "Informe um valor mensal maior que zero.";
    }

    if (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      nextErrors.dueDay = "Escolha um dia de vencimento entre 1 e 31.";
    }

    if (!isBillingCycle(parsedBillingCycle)) {
      nextErrors.billingCycle = "Escolha uma periodicidade de cobrança.";
    }

    if (!formData.billingStartDate) {
      nextErrors.billingStartDate = "Informe a data de início da cobrança.";
    } else if (billingStartDate !== formData.billingStartDate) {
      nextErrors.billingStartDate = "Informe uma data válida.";
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const billingCycle: BillingCycle = isBillingCycle(parsedBillingCycle) ? parsedBillingCycle : 1;
    const payload: ClientPayload = {
      name: trimmedName,
      email: trimmedEmail,
      phone: parsedPhone,
      monthlyAmount: parsedMonthlyAmount,
      dueDay: parsedDueDay,
      billingCycle,
      billingStartDate
    };

    setIsSaving(true);

    try {
      if (modalMode === "edit" && selectedClient) {
        await runWithFeedback({
          action: () => clientsService.update(selectedClient.id, payload),
          successTitle: "Cliente atualizado",
          successMessage: `${payload.name} foi atualizado com sucesso.`,
          errorTitle: "Erro ao salvar cliente",
          errorFallbackMessage: "Nao foi possivel salvar o cliente agora.",
          onError: async (message) => {
            if (message.toLowerCase().includes("assinatura") || message.toLowerCase().includes("limite de clientes")) {
              await refreshSubscription();
            }
            setErrorMessage(message);
          }
        });
      } else {
        await runWithFeedback({
          action: () => clientsService.create(payload),
          successTitle: "Cliente criado com sucesso",
          successMessage: `${payload.name} entrou para a sua base de cobranca.`,
          errorTitle: "Erro ao salvar cliente",
          errorFallbackMessage: "Nao foi possivel salvar o cliente agora.",
          onError: async (message) => {
            if (message.toLowerCase().includes("assinatura") || message.toLowerCase().includes("limite de clientes")) {
              await refreshSubscription();
            }
            setErrorMessage(message);
          }
        });
      }

      setIsModalOpen(false);
      resetFormState();
      await refreshSubscription();
      refreshCurrentPage();
    } catch {
      // O feedback visual ja foi tratado pelo hook.
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateInvoice(client: Client) {
    if (isSubscriptionBlocked) {
      showToast({
        tone: "error",
        title: "Assinatura inativa",
        message: "Sua assinatura esta inativa. Faca upgrade para continuar."
      });
      return;
    }

    updateRowAction(client.id, "generate");
    setErrorMessage("");

    try {
      await invoicesService.generateInvoice(client.id);
      showToast({
        tone: "success",
        title: "Cobrança gerada com sucesso.",
        actionLabel: "Ver cobranças",
        onAction: () => navigate("/invoices")
      });
    } catch (error) {
      if (isInvoiceAlreadyExistsError(error)) {
        setInvoiceConflictTarget(client);
        return;
      }

      const message = getErrorMessage(error, "Não foi possível gerar a cobrança.");

      if (message.toLowerCase().includes("assinatura") || message.toLowerCase().includes("limite de clientes")) {
        await refreshSubscription();
      }

      setErrorMessage(message);
      showToast({
        tone: "error",
        title: "Erro ao gerar cobrança",
        message
      });
    } finally {
      updateRowAction(client.id);
    }
  }

  async function handleGenerateInvoiceFromSummary() {
    const client = billingSummary?.client ?? billingSummaryTarget;

    if (!client) {
      return;
    }

    if (isSubscriptionBlocked) {
      showToast({
        tone: "error",
        title: "Assinatura inativa",
        message: "Sua assinatura esta inativa. Faca upgrade para continuar."
      });
      return;
    }

    setBillingActionState("generate");
    setBillingSummaryError("");

    try {
      await invoicesService.generateInvoice(client.id);
      showToast({
        tone: "success",
        title: "Cobrança gerada com sucesso."
      });
      await refreshOpenBillingSummary();
      refreshCurrentPage();
    } catch (error) {
      const message = getErrorMessage(error, "Não foi possível gerar a cobrança.");

      if (message.toLowerCase().includes("assinatura") || message.toLowerCase().includes("limite de clientes")) {
        await refreshSubscription();
      }

      setBillingSummaryError(message);
      showToast({
        tone: "error",
        title: "Erro ao gerar cobrança",
        message
      });
    } finally {
      setBillingActionState(null);
    }
  }

  async function handleMarkSummaryInvoiceAsPaid(invoice: InvoiceSummary) {
    if (isSubscriptionBlocked) {
      showToast({
        tone: "error",
        title: "Assinatura inativa",
        message: "Sua assinatura esta inativa. Faca upgrade para continuar."
      });
      return;
    }

    setBillingActionState("pay");
    setBillingSummaryError("");

    try {
      await runWithFeedback({
        action: () => invoicesService.markAsPaid(invoice.id),
        successTitle: "Pagamento marcado",
        successMessage: "A cobrança foi marcada como paga com sucesso.",
        errorTitle: "Erro ao marcar pagamento",
        errorFallbackMessage: "Não foi possível marcar a cobrança como paga agora.",
        onError: async (message) => {
          if (message.toLowerCase().includes("assinatura")) {
            await refreshSubscription();
          }
          setBillingSummaryError(message);
        }
      });
      await refreshOpenBillingSummary();
      refreshCurrentPage();
    } catch {
      // O feedback visual ja foi tratado pelo hook.
    } finally {
      setBillingActionState(null);
    }
  }

  async function handleChargeSummaryInvoiceOnWhatsApp(invoice: InvoiceSummary) {
    if (isSubscriptionBlocked) {
      showToast({
        tone: "error",
        title: "Assinatura inativa",
        message: "Sua assinatura esta inativa. Faca upgrade para continuar."
      });
      return;
    }

    if (subscription && !canUseWhatsApp(subscription.plan)) {
      setUpgradeModalOpen(true);
      return;
    }

    setBillingActionState("whatsapp");
    setBillingSummaryError("");

    try {
      const preview = await runWithFeedback({
        action: async () => {
          const response = await messageTemplateService.getWhatsAppPreview(invoice.id);

          if (!response.whatsAppUrl) {
            throw new Error("Não foi possível gerar o link do WhatsApp agora.");
          }

          return response;
        },
        successTitle: "Mensagem aberta no WhatsApp",
        successMessage: `A cobrança de ${getInvoiceClient(invoice)} está pronta para envio.`,
        errorTitle: "Erro ao abrir WhatsApp",
        errorFallbackMessage: "Não foi possível preparar a cobrança por WhatsApp agora.",
        onError: async (message) => {
          if (message.toLowerCase().includes("assinatura")) {
            await refreshSubscription();
          }
          setBillingSummaryError(message);
        }
      });
      window.open(preview.whatsAppUrl, "_blank", "noopener,noreferrer");
      await refreshOpenBillingSummary();
    } catch {
      // O feedback visual ja foi tratado pelo hook.
    } finally {
      setBillingActionState(null);
    }
  }

  async function handleReplaceInvoice() {
    if (!invoiceConflictTarget) {
      return;
    }

    const target = invoiceConflictTarget;
    setIsReplacingInvoice(true);
    setErrorMessage("");

    try {
      await invoicesService.replaceInvoice(target.id);
      showToast({
        tone: "success",
        title: "Cobrança substituída com sucesso.",
        actionLabel: "Ver cobranças",
        onAction: () => navigate("/invoices")
      });
      setInvoiceConflictTarget(null);
    } catch (error) {
      if (isInvoiceAlreadyPaidError(error)) {
        const message = "Esta cobrança já foi paga e não pode ser substituída.";
        setInvoiceConflictTarget(null);
        showToast({
          tone: "error",
          title: "Cobrança já paga",
          message
        });
        return;
      }

      const message = getErrorMessage(error, "Não foi possível substituir a cobrança.");

      if (message.toLowerCase().includes("assinatura") || message.toLowerCase().includes("limite de clientes")) {
        await refreshSubscription();
      }

      setErrorMessage(message);
      showToast({
        tone: "error",
        title: "Erro ao substituir cobrança",
        message
      });
    } finally {
      setIsReplacingInvoice(false);
    }
  }

  async function handleDeleteClient() {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    updateRowAction(target.id, "delete");
    setErrorMessage("");

    try {
      await runWithFeedback({
        action: () => clientsService.remove(target.id),
        successTitle: "Cliente excluido",
        successMessage: `${target.name} foi removido da sua base.`,
        errorTitle: "Erro ao excluir cliente",
        errorFallbackMessage: "Nao foi possivel excluir o cliente agora.",
        onError: async (message) => {
          setErrorMessage(message);
        }
      });
      setDeleteTarget(null);

      if (listState.items.length === 1 && listState.page > 1) {
        await refreshSubscription();
        setQuery((current) => ({
          ...current,
          page: Math.max((current.page ?? 1) - 1, 1)
        }));
      } else {
        await refreshSubscription();
        refreshCurrentPage();
      }
    } catch {
      // O feedback visual ja foi tratado pelo hook.
    } finally {
      updateRowAction(target.id);
    }
  }

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => value.trim() !== ""),
    [filters]
  );
  const isSubscriptionBlocked = Boolean(subscription && isSubscriptionInactive(subscription.status));
  const isClientLimitReached = Boolean(
    subscription && subscription.maxClients > 0 && subscription.currentClients >= subscription.maxClients
  );
  const isCreationBlocked = isSubscriptionBlocked || isClientLimitReached;
  const modalTitle = modalMode === "edit" ? "Editar cliente" : "Novo cliente";
  const modalDescription =
    modalMode === "edit"
      ? "Atualize os dados do contrato recorrente e mantenha os vencimentos em ordem."
      : "Preencha os dados para cadastrar um novo contrato recorrente.";
  const modalSubmitLabel = modalMode === "edit" ? "Salvar alteracoes" : "Salvar cliente";
  const summaryClient = billingSummary?.client ?? billingSummaryTarget;
  const currentInvoice = billingSummary?.currentInvoice ?? null;
  const currentInvoiceStatus = currentInvoice ? resolveInvoiceStatus(currentInvoice.status, currentInvoice.paidAt) : "pending";
  const currentInvoicePaid = currentInvoiceStatus === "paid";
  const billingHistory = billingSummary?.history ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Cadastre clientes recorrentes, filtre contratos e gere cobrancas manualmente quando fizer sentido para a operacao."
        action={
          <Button onClick={openCreateModal} disabled={isCreationBlocked}>
            Novo cliente
          </Button>
        }
      />

      {isSubscriptionBlocked ? (
        <AlertBanner
          tone="danger"
          title="Sua assinatura esta inativa. Faca upgrade para continuar."
          description="Enquanto a assinatura estiver expirada ou cancelada, novos clientes e novas cobrancas ficam bloqueados."
          action={
            <Button variant="secondary" onClick={() => navigate("/upgrade")}>
              Fazer upgrade
            </Button>
          }
        />
      ) : null}

      <Card
        className={
          isClientLimitReached && !isSubscriptionBlocked
            ? "border border-amber-200 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10"
            : "bg-white/90 dark:bg-slate-900/85"
        }
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Assinatura</p>
              {subscription ? (
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSubscriptionStatusTone(subscription.status)}`}
                >
                  {formatSubscriptionStatus(subscription.status)}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
              <p className="text-lg font-bold text-slate-950 dark:text-white">
                {isSubscriptionBlocked ? "Ultimo plano" : "Plano atual"}: {subscription ? formatSubscriptionPlan(subscription.plan) : "..."}
              </p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Clientes: {subscription ? `${subscription.currentClients} / ${subscription.maxClients}` : "..."}
              </p>
            </div>
            {isClientLimitReached && !isSubscriptionBlocked ? (
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Voce atingiu o limite de clientes do seu plano.
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {isSubscriptionBlocked
                  ? "O resumo do plano e do consumo permanece visivel aqui para referencia."
                  : "Voce ainda pode cadastrar novos clientes dentro do limite atual do seu plano."}
              </p>
            )}
          </div>

          {isClientLimitReached && !isSubscriptionBlocked ? (
            <Button
              variant="secondary"
              onClick={() => navigate("/upgrade")}
            >
              Fazer upgrade
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="bg-white/90 dark:bg-slate-900/85">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleApplyFilters}>
          <Input
            label="Busca"
            placeholder="Nome ou e-mail"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <Input
            label="Dia do vencimento"
            type="number"
            min="1"
            max="31"
            placeholder="Ex.: 5"
            value={filters.dueDay}
            onChange={(event) => setFilters((current) => ({ ...current, dueDay: event.target.value }))}
          />
          <Input
            label="Valor minimo"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex.: 500"
            value={filters.minMonthlyAmount}
            onChange={(event) =>
              setFilters((current) => ({ ...current, minMonthlyAmount: event.target.value }))
            }
          />
          <Input
            label="Valor maximo"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex.: 1000"
            value={filters.maxMonthlyAmount}
            onChange={(event) =>
              setFilters((current) => ({ ...current, maxMonthlyAmount: event.target.value }))
            }
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Button type="submit" fullWidth>
              Aplicar
            </Button>
            <Button type="button" variant="ghost" fullWidth onClick={handleClearFilters}>
              Limpar
            </Button>
          </div>
        </form>
      </Card>

      {errorMessage ? (
        <Card className="border border-rose-100 bg-rose-50/90 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-100">{errorMessage}</p>
        </Card>
      ) : null}

      <Card className="p-0">
        <div className="table-shell">
          <div className="md:hidden">
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-300">
                Carregando clientes...
              </div>
            ) : listState.items.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title={hasActiveFilters ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                  description={
                    hasActiveFilters
                      ? "Ajuste ou limpe os filtros para tentar encontrar clientes novamente."
                      : "Crie seu primeiro cliente para comecar a organizar contratos recorrentes e gerar cobrancas manualmente."
                  }
                  action={
                    hasActiveFilters ? (
                      <Button variant="ghost" onClick={handleClearFilters}>
                        Limpar filtros
                      </Button>
                    ) : isSubscriptionBlocked ? (
                      <Button variant="secondary" onClick={() => navigate("/upgrade")}>
                        Fazer upgrade
                      </Button>
                    ) : (
                      <Button onClick={openCreateModal}>Cadastrar primeiro cliente</Button>
                    )
                  }
                />
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {listState.items.map((client) => {
                  const rowAction = rowActionState[client.id];
                  const rowBusy = Boolean(rowAction);

                  return (
                    <article
                      key={client.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="min-w-0 truncate text-lg font-extrabold text-slate-950 dark:text-white">{client.name}</h2>
                          <span className="inline-flex shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                            {getBillingCycleLabel(client.billingCycle)}
                          </span>
                        </div>
                        <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-300">{client.email}</p>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                          <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Telefone
                          </dt>
                          <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{formatPhone(client.phone)}</dd>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                          <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Vencimento
                          </dt>
                          <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-100">Dia {client.dueDay}</dd>
                        </div>
                        <div className="col-span-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                          <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Valor mensal
                          </dt>
                          <dd className="mt-1 text-base font-extrabold text-slate-950 dark:text-white">
                            {formatCurrency(client.monthlyAmount)}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          fullWidth
                          disabled={rowBusy || isSubscriptionBlocked}
                          loading={rowAction === "generate"}
                          loadingText="Gerando..."
                          onClick={() => handleGenerateInvoice(client)}
                        >
                          Gerar cobranca
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          fullWidth
                          disabled={rowBusy}
                          onClick={() => openBillingSummary(client)}
                        >
                          Ver cobranças
                        </Button>
                        <div>
                          <button
                            type="button"
                            aria-label={`Mais ações para ${client.name}`}
                            aria-expanded={activeMenuClientId === client.id}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            disabled={rowBusy}
                            onClick={() => setActiveMenuClientId((current) => (current === client.id ? null : client.id))}
                          >
                            <MoreIcon className="h-5 w-5" />
                          </button>
                          {activeMenuClientId === client.id ? (
                            <div className="mt-2 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 text-sm font-semibold shadow-soft dark:border-slate-700 dark:bg-slate-900">
                              <button
                                type="button"
                                className="block w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                onClick={() => {
                                  setActiveMenuClientId(null);
                                  openEditModal(client);
                                }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="block w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                onClick={() => {
                                  setActiveMenuClientId(null);
                                  setDeleteTarget(client);
                                }}
                              >
                                Excluir
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-left dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-950/80">
                <tr className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">E-mail</th>
                  <th className="px-6 py-4 font-semibold">Telefone</th>
                  <th className="px-6 py-4 font-semibold">Valor mensal</th>
                  <th className="px-6 py-4 font-semibold">Vencimento</th>
                  <th className="px-6 py-4 font-semibold text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-300">
                      Carregando clientes...
                    </td>
                  </tr>
                ) : listState.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8">
                      <EmptyState
                        title={hasActiveFilters ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                        description={
                          hasActiveFilters
                            ? "Ajuste ou limpe os filtros para tentar encontrar clientes novamente."
                            : "Crie seu primeiro cliente para comecar a organizar contratos recorrentes e gerar cobrancas manualmente."
                        }
                        action={
                          hasActiveFilters ? (
                            <Button variant="ghost" onClick={handleClearFilters}>
                              Limpar filtros
                            </Button>
                          ) : isSubscriptionBlocked ? (
                            <Button variant="secondary" onClick={() => navigate("/upgrade")}>
                              Fazer upgrade
                            </Button>
                          ) : (
                            <Button onClick={openCreateModal}>Cadastrar primeiro cliente</Button>
                          )
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  listState.items.map((client) => {
                    const rowAction = rowActionState[client.id];
                    const rowBusy = Boolean(rowAction);

                    return (
                      <tr key={client.id} className="text-sm text-slate-700 dark:text-slate-300">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-semibold text-slate-950 dark:text-white">{client.name}</span>
                            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                              {getBillingCycleLabel(client.billingCycle)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{client.email}</td>
                        <td className="px-6 py-4">{formatPhone(client.phone)}</td>
                        <td className="px-6 py-4">{formatCurrency(client.monthlyAmount)}</td>
                        <td className="px-6 py-4">Todo dia {client.dueDay}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={rowBusy || isSubscriptionBlocked}
                              loading={rowAction === "generate"}
                              loadingText="Gerando..."
                              onClick={() => handleGenerateInvoice(client)}
                            >
                              Gerar cobranca
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={rowBusy}
                              onClick={() => openBillingSummary(client)}
                            >
                              Ver cobranças
                            </Button>
                            <div>
                              <button
                                type="button"
                                aria-label={`Mais ações para ${client.name}`}
                                aria-expanded={activeMenuClientId === client.id}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                disabled={rowBusy}
                                onClick={() => setActiveMenuClientId((current) => (current === client.id ? null : client.id))}
                              >
                                <MoreIcon className="h-5 w-5" />
                              </button>
                              {activeMenuClientId === client.id ? (
                                <div className="mt-2 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 text-sm font-semibold shadow-soft dark:border-slate-700 dark:bg-slate-900">
                                  <button
                                    type="button"
                                    className="block w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                    onClick={() => {
                                      setActiveMenuClientId(null);
                                      openEditModal(client);
                                    }}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                    onClick={() => {
                                      setActiveMenuClientId(null);
                                      setDeleteTarget(client);
                                    }}
                                  >
                                    Excluir
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={listState.page}
            totalPages={listState.totalPages}
            totalCount={listState.totalCount}
            onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
          />
        </div>
      </Card>

      <Modal
        open={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        onClose={() => {
          setIsModalOpen(false);
          resetFormState();
        }}
      >
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSaveClient}>
          <div className="md:col-span-2">
            <Input
              label="Nome"
              value={formData.name}
              onChange={(event) => updateFormField("name", event.target.value)}
              placeholder="Ex.: Estudio Aurora"
              error={formErrors.name}
              required
            />
          </div>
          <Input
            label="E-mail"
            type="email"
            value={formData.email}
            onChange={(event) => updateFormField("email", event.target.value)}
            placeholder="financeiro@cliente.com"
            error={formErrors.email}
            required
          />
          <Input
            label="Telefone"
            value={formData.phone}
            onChange={(event) => updateFormField("phone", formatPhone(event.target.value))}
            placeholder="(11) 99999-9999"
            inputMode="numeric"
            maxLength={15}
            error={formErrors.phone}
            required
          />
          <Input
            label="Valor mensal"
            value={formData.monthlyAmount}
            onChange={(event) => updateFormField("monthlyAmount", formatCurrencyBRL(event.target.value))}
            placeholder="R$ 0,00"
            inputMode="numeric"
            error={formErrors.monthlyAmount}
            required
          />
          <Select
            label="Dia do vencimento"
            value={formData.dueDay}
            onChange={(event) => updateFormField("dueDay", event.target.value)}
            error={formErrors.dueDay}
            required
          >
            {Array.from({ length: 31 }, (_, index) => {
              const day = String(index + 1);

              return (
                <option key={day} value={day}>
                  Dia {day}
                </option>
              );
            })}
          </Select>
          <Select
            label="Periodicidade de cobrança"
            value={formData.billingCycle}
            onChange={(event) => updateFormField("billingCycle", event.target.value)}
            error={formErrors.billingCycle}
            required
          >
            {BILLING_CYCLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="space-y-2">
            <Input
              label="Início da cobrança"
              type="date"
              value={formData.billingStartDate}
              onChange={(event) => updateFormField("billingStartDate", event.target.value)}
              error={formErrors.billingStartDate}
              required
            />
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Usamos essa data para saber em quais meses gerar cobranças automaticamente.
            </p>
          </div>

          <div className="flex justify-end gap-3 md:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                resetFormState();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isSaving}
              loadingText={modalMode === "edit" ? "Salvando..." : "Criando..."}
            >
              {modalSubmitLabel}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(billingSummaryTarget)}
        title={summaryClient ? `Cobranças de ${summaryClient.name}` : "Cobranças do cliente"}
        description="Resumo financeiro do cliente, cobrança atual, próxima previsão e histórico."
        size="lg"
        onClose={closeBillingSummary}
      >
        <div className="space-y-5">
          {isBillingSummaryLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
              Carregando resumo de cobranças...
            </div>
          ) : null}

          {billingSummaryError ? (
            <div className="rounded-3xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
              {billingSummaryError}
            </div>
          ) : null}

          {summaryClient && !isBillingSummaryLoading ? (
            <>
              <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Dados do cliente</h3>
                  <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                    {getBillingCycleLabel(summaryClient.billingCycle)}
                  </span>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Nome</dt>
                    <dd className="mt-1 font-bold text-slate-950 dark:text-white">{summaryClient.name}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">E-mail</dt>
                    <dd className="mt-1 break-all font-bold text-slate-950 dark:text-white">{summaryClient.email}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Telefone</dt>
                    <dd className="mt-1 font-bold text-slate-950 dark:text-white">{formatPhone(summaryClient.phone)}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Valor</dt>
                    <dd className="mt-1 font-bold text-slate-950 dark:text-white">{formatCurrency(summaryClient.monthlyAmount)}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Periodicidade</dt>
                    <dd className="mt-1 font-bold text-slate-950 dark:text-white">{getBillingCycleLabel(summaryClient.billingCycle)}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Dia de vencimento</dt>
                    <dd className="mt-1 font-bold text-slate-950 dark:text-white">Dia {summaryClient.dueDay}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50 sm:col-span-2">
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Início da cobrança</dt>
                    <dd className="mt-1 font-bold text-slate-950 dark:text-white">{formatDate(summaryClient.billingStartDate)}</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Cobrança atual</h3>
                  {currentInvoice ? <StatusBadge status={currentInvoice.status} paidAt={currentInvoice.paidAt} /> : null}
                </div>

                {currentInvoice ? (
                  <div className="space-y-4">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                        <dt className="font-semibold text-slate-500 dark:text-slate-400">Valor</dt>
                        <dd className="mt-1 text-base font-extrabold text-slate-950 dark:text-white">{formatCurrency(currentInvoice.amount)}</dd>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                        <dt className="font-semibold text-slate-500 dark:text-slate-400">Vencimento</dt>
                        <dd className="mt-1 font-bold text-slate-950 dark:text-white">{formatDate(currentInvoice.dueDate)}</dd>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                        <dt className="font-semibold text-slate-500 dark:text-slate-400">Status</dt>
                        <dd className="mt-1">
                          <StatusBadge status={currentInvoice.status} paidAt={currentInvoice.paidAt} />
                        </dd>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                        <dt className="font-semibold text-slate-500 dark:text-slate-400">Pago em</dt>
                        <dd className="mt-1 font-bold text-slate-950 dark:text-white">{formatDate(currentInvoice.paidAt)}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      {!currentInvoicePaid ? (
                        <Button
                          type="button"
                          variant="secondary"
                          loading={billingActionState === "pay"}
                          loadingText="Processando..."
                          disabled={Boolean(billingActionState) || isSubscriptionBlocked}
                          onClick={() => handleMarkSummaryInvoiceAsPaid(currentInvoice)}
                        >
                          Marcar como pago
                        </Button>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm font-semibold text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                        disabled={Boolean(billingActionState) || isSubscriptionBlocked}
                        onClick={() => handleChargeSummaryInvoiceOnWhatsApp(currentInvoice)}
                      >
                        {billingActionState === "whatsapp" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                        ) : (
                          <WhatsAppIcon className="h-4 w-4" />
                        )}
                        WhatsApp
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
                      Nenhuma cobrança gerada para o período atual.
                    </p>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        loading={billingActionState === "generate"}
                        loadingText="Gerando..."
                        disabled={Boolean(billingActionState) || isSubscriptionBlocked}
                        onClick={handleGenerateInvoiceFromSummary}
                      >
                        Gerar cobrança
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-primary-100 bg-primary-50/70 p-4 dark:border-primary-500/30 dark:bg-primary-500/10">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Próxima cobrança prevista</h3>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {billingSummary?.nextDueDate
                    ? `Próxima cobrança prevista para ${formatDate(billingSummary.nextDueDate)}`
                    : "Nenhuma próxima cobrança prevista no momento."}
                </p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Histórico</h3>
                {billingHistory.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {billingHistory.map((invoice) => (
                      <article
                        key={invoice.id}
                        className="grid gap-3 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950/50 sm:grid-cols-[1fr_auto]"
                      >
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="font-semibold text-slate-500 dark:text-slate-400">Vencimento</p>
                            <p className="mt-1 font-bold text-slate-950 dark:text-white">{formatDate(invoice.dueDate)}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-500 dark:text-slate-400">Valor</p>
                            <p className="mt-1 font-bold text-slate-950 dark:text-white">{formatCurrency(invoice.amount)}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-500 dark:text-slate-400">Pago em</p>
                            <p className="mt-1 font-bold text-slate-950 dark:text-white">{formatDate(invoice.paidAt)}</p>
                          </div>
                        </div>
                        <div className="sm:self-center">
                          <StatusBadge status={invoice.status} paidAt={invoice.paidAt} />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
                    Nenhuma cobrança no histórico.
                  </p>
                )}
              </section>
            </>
          ) : null}
        </div>
      </Modal>

      <WhatsAppUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onUpgrade={() => {
          setUpgradeModalOpen(false);
          navigate("/upgrade");
        }}
      />

      <Modal
        open={Boolean(deleteTarget)}
        title="Excluir cliente"
        description="Essa acao remove o cliente da base. Confirme apenas se tiver certeza."
        onClose={() => setDeleteTarget(null)}
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
            {deleteTarget
              ? `Voce esta prestes a excluir ${deleteTarget.name}.`
              : "Voce esta prestes a excluir um cliente."}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteTarget ? rowActionState[deleteTarget.id] === "delete" : false}
              loadingText="Excluindo..."
              onClick={handleDeleteClient}
            >
              Confirmar exclusao
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(invoiceConflictTarget)}
        title="Cobrança já existente"
        description="Já existe uma cobrança para este cliente no mês atual. Deseja substituir a cobrança atual por uma nova usando os dados atualizados do cliente?"
        hideCloseButton
        onClose={() => {
          if (!isReplacingInvoice) {
            setInvoiceConflictTarget(null);
          }
        }}
      >
        <div className="space-y-5">
          <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            Cobranças já pagas não podem ser substituídas.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={isReplacingInvoice}
              onClick={() => setInvoiceConflictTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={isReplacingInvoice}
              loadingText="Substituindo..."
              onClick={handleReplaceInvoice}
            >
              Substituir cobrança
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
