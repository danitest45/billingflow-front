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
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../services/api";
import { invoicesService } from "../services/invoices";
import { subscriptionService } from "../services/subscription";
import type { Invoice, InvoiceListParams, PaginatedResponse, SubscriptionInfo } from "../types/domain";
import { formatCurrency, formatDate, isSubscriptionInactive, resolveInvoiceStatus } from "../utils/format";

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

export function InvoicesPage() {
  usePageTitle("Cobrancas");

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [listState, setListState] = useState<PaginatedResponse<Invoice>>(initialListState);
  const [filters, setFilters] = useState<InvoiceFilterForm>(emptyFilters);
  const [query, setQuery] = useState<InvoiceListParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE
  });
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyInvoiceId, setBusyInvoiceId] = useState<string | null>(null);

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
      try {
        const response = await subscriptionService.getDetails();
        setSubscription(response);
      } catch {
        setSubscription(null);
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

    setBusyInvoiceId(id);
    setErrorMessage("");

    try {
      await invoicesService.markAsPaid(id);
      showToast({
        tone: "success",
        title: "Cobranca atualizada",
        message: "A cobranca foi marcada como paga com sucesso."
      });

      refreshCurrentPage();
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel marcar a cobranca como paga agora.");
      if (message.toLowerCase().includes("assinatura")) {
        await refreshSubscription();
      }
      setErrorMessage(message);
      showToast({
        tone: "error",
        title: "Falha ao atualizar cobranca",
        message
      });
    } finally {
      setBusyInvoiceId(null);
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
          description="Enquanto a assinatura estiver expirada ou cancelada, a marcacao de pagamento fica bloqueada."
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
                  <th className="px-6 py-4 font-semibold text-right">Acao</th>
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

                    return (
                      <tr key={invoice.id} className="text-sm text-slate-700 dark:text-slate-300">
                        <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">{getInvoiceClient(invoice)}</td>
                        <td className="px-6 py-4">{formatCurrency(invoice.amount)}</td>
                        <td className="px-6 py-4">{formatDate(invoice.dueDate)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={invoice.status} paidAt={invoice.paidAt} />
                        </td>
                        <td className="px-6 py-4">{formatDate(invoice.paidAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant={isPaid ? "ghost" : "secondary"}
                            disabled={isPaid || isSubscriptionBlocked}
                            loading={busyInvoiceId === invoice.id}
                            onClick={() => handleMarkAsPaid(invoice.id)}
                          >
                            {isPaid ? "Pago" : isSubscriptionBlocked ? "Indisponivel" : "Marcar como pago"}
                          </Button>
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
    </div>
  );
}
