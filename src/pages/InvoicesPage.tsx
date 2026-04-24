import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertBanner } from "../components/common/AlertBanner";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { Input } from "../components/common/Input";
import { PageHeader } from "../components/common/PageHeader";
import { PaginationControls } from "../components/common/PaginationControls";
import { Select } from "../components/common/Select";
import { StatusBadge } from "../components/common/StatusBadge";
import { WhatsAppUpgradeModal } from "../components/subscription/WhatsAppUpgradeModal";
import { useApiFeedback } from "../hooks/useApiFeedback";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../services/api";
import { invoicesService } from "../services/invoices";
import { messageTemplateService } from "../services/messageTemplate";
import { subscriptionService } from "../services/subscription";
import type { Invoice, InvoiceListParams, PaginatedResponse, SubscriptionInfo } from "../types/domain";
import { canUseWhatsApp, formatCurrency, formatDate, isSubscriptionInactive, resolveInvoiceStatus } from "../utils/format";

type InvoiceRowAction = "pay" | "whatsapp";

type InvoiceFilterForm = {
  clientName: string;
  status: string;
  startDate: string;
  endDate: string;
};

const DEFAULT_PAGE_SIZE = 10;

const emptyFilters: InvoiceFilterForm = {
  clientName: "",
  status: "",
  startDate: "",
  endDate: ""
};

const initialListState: PaginatedResponse<Invoice> = {
  items: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalCount: 0,
  totalPages: 1
};

function buildInvoiceQuery(filters: InvoiceFilterForm): InvoiceListParams {
  return {
    clientName: filters.clientName.trim() || undefined,
    status: filters.status ? Number(filters.status) : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined
  };
}

function getInvoiceClient(invoice: Invoice) {
  return invoice.clientName || "Cliente nao informado";
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19.1 4.9A9.6 9.6 0 0 0 3.8 16.2L3 21l4.9-1.3A9.6 9.6 0 0 0 19.1 4.9Z" />
      <path d="M8.8 8.6c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.3.1.5-.1.7l-.4.5c-.1.1-.2.3-.1.5.5 1 1.3 1.8 2.3 2.3.2.1.4 0 .5-.1l.6-.5c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.4.6 0 .6-.4 1.4-1 1.6-.7.3-2 .2-3.7-.7-1.9-1-3.4-2.5-4.3-4.3-.8-1.6-1-2.8-.7-3.5Z" />
    </svg>
  );
}

export function InvoicesPage() {
  usePageTitle("Cobrancas");

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { runWithFeedback } = useApiFeedback();
  const [listState, setListState] = useState<PaginatedResponse<Invoice>>(initialListState);
  const [filters, setFilters] = useState<InvoiceFilterForm>(emptyFilters);
  const [query, setQuery] = useState<InvoiceListParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE
  });
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [rowActionState, setRowActionState] = useState<Record<string, InvoiceRowAction | undefined>>({});
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  async function loadInvoices(activeQuery: InvoiceListParams) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await invoicesService.list(activeQuery);
      setListState(response);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Nao foi possivel carregar as cobrancas."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInvoices(query);
  }, [query]);

  useEffect(() => {
    async function loadSubscription() {
      setIsSubscriptionLoading(true);

      try {
        const response = await subscriptionService.getDetails();
        setSubscription(response);
      } catch {
        setSubscription(null);
      } finally {
        setIsSubscriptionLoading(false);
      }
    }

    void loadSubscription();
  }, []);

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

  function updateRowAction(invoiceId: string, action?: InvoiceRowAction) {
    setRowActionState((current) => ({
      ...current,
      [invoiceId]: action
    }));
  }

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery({
      ...buildInvoiceQuery(filters),
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

  async function handleMarkAsPaid(id: string) {
    if (isSubscriptionBlocked) {
      showToast({
        tone: "error",
        title: "Assinatura inativa",
        message: "Sua assinatura esta inativa. Faca upgrade para continuar."
      });
      return;
    }

    updateRowAction(id, "pay");
    setErrorMessage("");

    try {
      await runWithFeedback({
        action: () => invoicesService.markAsPaid(id),
        successTitle: "Pagamento marcado",
        successMessage: "A cobranca foi marcada como paga com sucesso.",
        errorTitle: "Erro ao marcar pagamento",
        errorFallbackMessage: "Nao foi possivel marcar a cobranca como paga agora.",
        onError: async (message) => {
          if (message.toLowerCase().includes("assinatura")) {
            await refreshSubscription();
          }
          setErrorMessage(message);
        }
      });
      refreshCurrentPage();
    } catch {
      // O feedback visual ja foi tratado pelo hook.
    } finally {
      updateRowAction(id);
    }
  }

  async function handleChargeOnWhatsApp(invoice: Invoice) {
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

    updateRowAction(invoice.id, "whatsapp");
    setErrorMessage("");

    try {
      const preview = await runWithFeedback({
        action: async () => {
          const response = await messageTemplateService.getWhatsAppPreview(invoice.id);

          if (!response.whatsAppUrl) {
            throw new Error("Nao foi possivel gerar o link do WhatsApp agora.");
          }

          return response;
        },
        successTitle: "Mensagem aberta no WhatsApp",
        successMessage: `A cobranca de ${getInvoiceClient(invoice)} esta pronta para envio.`,
        errorTitle: "Erro ao abrir WhatsApp",
        errorFallbackMessage: "Nao foi possivel preparar a cobranca por WhatsApp agora.",
        onError: async (message) => {
          if (message.toLowerCase().includes("assinatura")) {
            await refreshSubscription();
          }
          setErrorMessage(message);
        }
      });
      window.open(preview.whatsAppUrl, "_blank", "noopener,noreferrer");
    } catch {
      // O feedback visual ja foi tratado pelo hook.
    } finally {
      updateRowAction(invoice.id);
    }
  }

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => value.trim() !== ""),
    [filters]
  );
  const isSubscriptionBlocked = Boolean(subscription && isSubscriptionInactive(subscription.status));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cobrancas"
        description="Acompanhe vencimentos, status e acoes rapidas para reduzir atrasos e manter a operacao em dia."
      />

      {isSubscriptionBlocked ? (
        <AlertBanner
          tone="danger"
          title="Sua assinatura esta inativa. Faca upgrade para continuar."
          description="Enquanto a assinatura estiver expirada ou cancelada, as acoes de cobranca ficam bloqueadas."
          action={
            <Button variant="secondary" onClick={() => navigate("/upgrade")}>
              Fazer upgrade
            </Button>
          }
        />
      ) : null}

      <Card className="bg-white/90 dark:bg-slate-900/85">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleApplyFilters}>
          <Input
            label="Cliente"
            placeholder="Buscar por nome do cliente"
            value={filters.clientName}
            onChange={(event) =>
              setFilters((current) => ({ ...current, clientName: event.target.value }))
            }
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">Todos</option>
            <option value="1">Pendente</option>
            <option value="2">Pago</option>
            <option value="3">Atrasado</option>
          </Select>
          <Input
            label="Data inicial"
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
          />
          <Input
            label="Data final"
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
          />
          <div className="flex items-end gap-3">
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-950/80">
                <tr className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Valor</th>
                  <th className="px-6 py-4 font-semibold">Vencimento</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Pago em</th>
                  <th className="px-6 py-4 font-semibold text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-300">
                      Carregando cobrancas...
                    </td>
                  </tr>
                ) : listState.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8">
                      <EmptyState
                        title={hasActiveFilters ? "Nenhuma cobranca encontrada" : "Nenhuma cobranca encontrada"}
                        description={
                          hasActiveFilters
                            ? "Ajuste os filtros ou limpe a busca para encontrar outras cobrancas."
                            : "Gere uma cobranca na tela de clientes para comecar a acompanhar vencimentos e pagamentos por aqui."
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
                            <Button variant="secondary" onClick={() => navigate("/clients")}>
                              Ir para clientes
                            </Button>
                          )
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  listState.items.map((invoice) => {
                    const normalizedStatus = resolveInvoiceStatus(invoice.status, invoice.paidAt);
                    const isPaid = normalizedStatus === "paid";
                    const rowAction = rowActionState[invoice.id];
                    const rowBusy = Boolean(rowAction);

                    return (
                      <tr key={invoice.id} className="text-sm text-slate-700 dark:text-slate-300">
                        <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">{getInvoiceClient(invoice)}</td>
                        <td className="px-6 py-4">{formatCurrency(invoice.amount)}</td>
                        <td className="px-6 py-4">{formatDate(invoice.dueDate)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={invoice.status} paidAt={invoice.paidAt} />
                        </td>
                        <td className="px-6 py-4">{formatDate(invoice.paidAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant={isPaid ? "ghost" : "secondary"}
                              disabled={isPaid || isSubscriptionBlocked || rowBusy}
                              loading={rowAction === "pay"}
                              loadingText="Processando..."
                              onClick={() => handleMarkAsPaid(invoice.id)}
                            >
                              {isPaid ? "Pago" : isSubscriptionBlocked ? "Indisponivel" : "Marcar como pago"}
                            </Button>
                            <button
                              type="button"
                              title="Cobrar pelo WhatsApp"
                              aria-label={`Cobrar ${getInvoiceClient(invoice)} pelo WhatsApp`}
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                                isPaid
                                  ? "border-slate-200 bg-white/70 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-500 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                                  : "border-emerald-100 bg-emerald-50/70 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                              }`}
                              disabled={isSubscriptionLoading || isSubscriptionBlocked || rowBusy}
                              onClick={() => handleChargeOnWhatsApp(invoice)}
                            >
                              {rowAction === "whatsapp" ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                              ) : (
                                <WhatsAppIcon className="h-4 w-4" />
                              )}
                            </button>
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

      <WhatsAppUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onUpgrade={() => {
          setUpgradeModalOpen(false);
          navigate("/upgrade");
        }}
      />
    </div>
  );
}
