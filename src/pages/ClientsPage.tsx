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
import { branding } from "../config/branding";
import { useApiFeedback } from "../hooks/useApiFeedback";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { ApiError, getErrorMessage } from "../services/api";
import { clientsService } from "../services/clients";
import { invoicesService } from "../services/invoices";
import { subscriptionService } from "../services/subscription";
import type {
  Client,
  ClientListParams,
  ClientPayload,
  PaginatedResponse,
  SubscriptionInfo
} from "../types/domain";
import {
  formatCurrency,
  getSubscriptionStatusTone,
  isSubscriptionInactive,
  formatSubscriptionPlan,
  formatSubscriptionStatus
} from "../utils/format";
import { formatCurrencyBRL, formatPhone, parseCurrencyBRL, unmaskPhone } from "../utils/clientForm";

type ClientModalMode = "create" | "edit";
type ClientRowAction = "generate" | "delete";
type ClientFormValues = {
  name: string;
  email: string;
  phone: string;
  monthlyAmount: string;
  dueDay: string;
};
type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;
type ClientFilterForm = {
  search: string;
  dueDay: string;
  minMonthlyAmount: string;
  maxMonthlyAmount: string;
};

const DEFAULT_PAGE_SIZE = 10;

const emptyForm: ClientFormValues = {
  name: "",
  email: "",
  phone: "",
  monthlyAmount: "",
  dueDay: "1"
};

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
  const [formData, setFormData] = useState<ClientFormValues>(emptyForm);
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
    setFormData(emptyForm);
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
      dueDay: String(client.dueDay)
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

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: ClientPayload = {
      name: trimmedName,
      email: trimmedEmail,
      phone: parsedPhone,
      monthlyAmount: parsedMonthlyAmount,
      dueDay: parsedDueDay
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
                        <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">{client.name}</td>
                        <td className="px-6 py-4">{client.email}</td>
                        <td className="px-6 py-4">{formatPhone(client.phone)}</td>
                        <td className="px-6 py-4">{formatCurrency(client.monthlyAmount)}</td>
                        <td className="px-6 py-4">Todo dia {client.dueDay}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={rowBusy}
                              onClick={() => openEditModal(client)}
                            >
                              Editar
                            </Button>
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
                              variant="danger"
                              disabled={rowBusy}
                              loading={rowAction === "delete"}
                              loadingText="Excluindo..."
                              onClick={() => setDeleteTarget(client)}
                            >
                              Excluir
                            </Button>
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
