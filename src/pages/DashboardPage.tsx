import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { usePageTitle } from "../hooks/usePageTitle";
import { dashboardService, getErrorMessage } from "../services/api";
import { subscriptionService } from "../services/subscription";
import type { DashboardSummary, SubscriptionInfo } from "../types/domain";
import {
  formatCurrency,
  formatDate,
  getSubscriptionStatusTone,
  formatSubscriptionPlan,
  formatSubscriptionStatus
} from "../utils/format";

const initialSummary: DashboardSummary = {
  totalExpected: 0,
  totalPaid: 0,
  totalPending: 0,
  overdueCount: 0
};

export function DashboardPage() {
  usePageTitle("Dashboard");

  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [summaryResult, subscriptionResult] = await Promise.allSettled([
          dashboardService.getSummary(),
          subscriptionService.getDetails()
        ]);

        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value);
        } else {
          throw summaryResult.reason;
        }

        if (subscriptionResult.status === "fulfilled") {
          setSubscription(subscriptionResult.value);
        } else {
          setSubscription(null);
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Nao foi possivel carregar o resumo financeiro do dashboard."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Visao geral financeira"
        description="Acompanhe o que sua operacao deve receber, o que ja entrou em caixa e quais cobrancas exigem atencao imediata."
      />

      {errorMessage ? (
        <Card className="border border-rose-100 bg-rose-50/90 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-100">{errorMessage}</p>
        </Card>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Receita Esperada"
          value={isLoading ? "..." : formatCurrency(summary.totalExpected)}
          hint="Total previsto nas mensalidades ativas"
          accent="blue"
        />
        <StatCard
          title="Recebido"
          value={isLoading ? "..." : formatCurrency(summary.totalPaid)}
          hint="Valor pago e confirmado pelos clientes"
          accent="emerald"
        />
        <StatCard
          title="Pendente"
          value={isLoading ? "..." : formatCurrency(summary.totalPending)}
          hint="Cobrancas ainda abertas no periodo"
          accent="amber"
        />
        <StatCard
          title="Atrasados"
          value={isLoading ? "..." : String(summary.overdueCount)}
          hint="Cobrancas vencidas sem pagamento"
          accent="rose"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Plano atual</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  Acompanhe o status da assinatura e o consumo de clientes no seu plano.
                </p>
              </div>
              {subscription ? (
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSubscriptionStatusTone(subscription.status)}`}
                >
                  {formatSubscriptionStatus(subscription.status)}
                </span>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-700 dark:bg-slate-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Plano</p>
                <p className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">
                  {subscription ? formatSubscriptionPlan(subscription.plan) : "..."}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-700 dark:bg-slate-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Clientes</p>
                <p className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">
                  {subscription ? `${subscription.currentClients} / ${subscription.maxClients}` : "..."}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-primary-100 bg-primary-50/80 p-5 dark:border-primary-500/30 dark:bg-primary-500/10">
              <p className="text-sm font-semibold text-primary-800 dark:text-primary-100">
                {subscription?.endsAt
                  ? `Expira em: ${formatDate(subscription.endsAt)}`
                  : "Sem data de expiracao informada"}
              </p>
              <div className="mt-4">
                <Button variant="secondary" size="sm" onClick={() => navigate("/upgrade")}>
                  Fazer upgrade
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-950 text-white dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Saude do caixa</p>
          <p className="mt-5 text-4xl font-extrabold text-white">
            {summary.totalExpected > 0 ? `${Math.round((summary.totalPaid / summary.totalExpected) * 100)}%` : "0%"}
          </p>
          <p className="mt-2 text-sm text-slate-300">da receita esperada ja foi convertida em recebimento.</p>
        </Card>
      </section>
    </div>
  );
}
