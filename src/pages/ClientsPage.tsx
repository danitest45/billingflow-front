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
import { branding } from "../config/branding";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../services/api";
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

type ClientModalMode = "create" | "edit";
type ClientRowAction = "generate" | "delete";
type ClientFilterForm = {
  search: string;
  dueDay: string;
  minMonthlyAmount: string;
  maxMonthlyAmount: string;
};

const DEFAULT_PAGE_SIZE = 10;

const emptyForm: ClientPayload = {
  name: "",
  email: "",
  phone: "",
  monthlyAmount: 0,
  dueDay: 1
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

export function ClientsPage() {
  usePageTitle("Clientes");

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [listState, setListState] = useState<PaginatedResponse<Client>>(initialListState);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [filters, setFilters] = useState<ClientFilterForm>(emptyFilters);
  const [query, setQuery] = useState<ClientListParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE
  });
  const [formData, setFormData] = useState<ClientPayload>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ClientModalMode>("create");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
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

  function resetFormState() {
    setFormData(emptyForm);
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
    setIsModalOpen(true);
  }

  function openEditModal(client: Client) {
    setModalMode("edit");
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      monthlyAmount: client.monthlyAmount,
      dueDay: client.dueDay
    });
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
    setIsSaving(true);
    setErrorMessage("");

    const payload: ClientPayload = {
      ...formData,
      monthlyAmount: Number(formData.monthlyAmount),
      dueDay: Number(formData.dueDay)
    };

    try {
      if (modalMode === "edit" && selectedClient) {
        await clientsService.update(selectedClient.id, payload);
        showToast({
          tone: "success",
          title: "Cliente atualizado",
          message: `${payload.name} foi atualizado com sucesso.`
        });
      } else {
        await clientsService.create(payload);
        showToast({
          tone: "success",
          title: "Cliente criado",
          message: `${payload.name} entrou para a sua base de cobranca.`
        });
      }

      setIsModalOpen(false);
      resetFormState();
      await refreshSubscription();
      refreshCurrentPage();
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel salvar o cliente agora.");
      if (message.toLowerCase().includes("assinatura") || message.toLowerCase().includes("limite de clientes")) {
        await refreshSubscription();
      }
      setErrorMessage(message);
      showToast({
        tone: "error",
        title: "Falha ao salvar cliente",
        message
      });
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
      await invoicesService.generate(client.id);
      showToast({
        tone: "success",
        title: "Cobranca gerada",
        message: `A cobranca de ${client.name} foi criada com sucesso.`,
        actionLabel: "Ver cobrancas",
        onAction: () => navigate("/invoices")
      });
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel gerar a cobranca agora.");
      if (message.toLowerCase().includes("assinatura") || message.toLowerCase().includes("limite de clientes")) {
        await refreshSubscription();
      }
      setErrorMessage(message);
      showToast({
        tone: "error",
        title: "Falha ao gerar cobranca",
        message
      });
    } finally {
      updateRowAction(client.id);
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
      await clientsService.remove(target.id);
      setDeleteTarget(null);
      showToast({
        tone: "success",
        title: "Cliente excluido",
        message: `${target.name} foi removido da sua base.`
      });

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
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel excluir o cliente agora.");
      setErrorMessage(message);
      showToast({
        tone: "error",
        title: "Falha ao excluir cliente",
        message
      });
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
                        <td className="px-6 py-4">{client.phone}</td>
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
                              onClick={() => handleGenerateInvoice(client)}
                            >
                              Gerar cobranca
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={rowBusy}
                              loading={rowAction === "delete"}
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
              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex.: Estudio Aurora"
              required
            />
          </div>
          <Input
            label="E-mail"
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            placeholder="financeiro@cliente.com"
            required
          />
          <Input
            label="Telefone"
            value={formData.phone}
            onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
            placeholder="(11) 99999-9999"
            required
          />
          <Input
            label="Valor mensal"
            type="number"
            min="0"
            step="0.01"
            value={formData.monthlyAmount}
            onChange={(event) =>
              setFormData((current) => ({ ...current, monthlyAmount: Number(event.target.value) }))
            }
            required
          />
          <Input
            label="Dia do vencimento"
            type="number"
            min="1"
            max="31"
            value={formData.dueDay}
            onChange={(event) => setFormData((current) => ({ ...current, dueDay: Number(event.target.value) }))}
            required
          />

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
            <Button type="submit" loading={isSaving}>
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
              onClick={handleDeleteClient}
            >
              Confirmar exclusao
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
