import { useEffect, useState } from "react";
import { AlertBanner } from "../components/common/AlertBanner";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { SubscriptionOverviewCard } from "../components/subscription/SubscriptionOverviewCard";
import { branding } from "../config/branding";
import { useApiFeedback } from "../hooks/useApiFeedback";
import { usePageTitle } from "../hooks/usePageTitle";
import { getErrorMessage } from "../services/api";
import { billingService } from "../services/billing";
import { subscriptionService } from "../services/subscription";
import type { SubscriptionInfo, SubscriptionUpgradePlanType } from "../types/domain";
import { isSubscriptionCurrent, isSubscriptionInactive } from "../utils/format";

type PlanCard = {
  name: "Starter" | "Pro" | "Agency";
  planType: SubscriptionUpgradePlanType;
  price: string;
  description: string;
  valueMessage: string;
  maxClients: number;
  benefits: string[];
  featured?: boolean;
};

const plans: PlanCard[] = [
  {
    name: "Starter",
    planType: 2,
    price: "R$29,90 / mes",
    description: "Ideal para autonomos que estao comecando a organizar a cobranca.",
    valueMessage: "Organize a base de clientes, acompanhe pagamentos e saia das planilhas sem complicar a rotina.",
    maxClients: 10,
    benefits: [
      "Ate 10 clientes",
      "Cobranca via WhatsApp",
      "Cobrancas recorrentes organizadas",
      "Dashboard financeiro",
      "Controle de pagamentos",
      "Suporte por e-mail"
    ]
  },
  {
    name: "Pro",
    planType: 3,
    price: "R$59,90 / mes",
    description: "Melhor para freelancers e pequenas operacoes que querem mais agilidade.",
    valueMessage: "O melhor custo-beneficio para cobrar com WhatsApp, reduzir atrasos e manter a operacao mais previsivel.",
    maxClients: 30,
    benefits: [
      "Ate 30 clientes",
      "Cobranca via WhatsApp",
      "Mensagens personalizadas",
      "Dashboard financeiro completo",
      "Controle de inadimplencia",
      "Suporte prioritario"
    ],
    featured: true
  },
  {
    name: "Agency",
    planType: 4,
    price: "R$99,90 / mes",
    description: "Para negocios com maior volume de clientes e operacao mais robusta.",
    valueMessage: "Mais espaco para crescer, atender uma carteira maior e manter a gestao de cobrancas sob controle.",
    maxClients: 100,
    benefits: [
      "Ate 100 clientes",
      "Ideal para operacoes maiores",
      "Cobranca via WhatsApp",
      "Mensagens personalizadas",
      "Controle de multiplos clientes",
      "Suporte prioritario",
      "Mais espaco para escalar a operacao"
    ]
  }
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m4.5 10.5 3.3 3.3 7.7-8.1" />
    </svg>
  );
}

export function UpgradePage() {
  usePageTitle("Upgrade de plano");

  const { runWithFeedback } = useApiFeedback();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeUpgrade, setActiveUpgrade] = useState<SubscriptionUpgradePlanType | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSubscription() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await subscriptionService.getDetails();
        setSubscription(response);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Nao foi possivel carregar os dados da assinatura."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadSubscription();
  }, []);

  async function handleUpgrade(plan: PlanCard) {
    setActiveUpgrade(plan.planType);
    setErrorMessage("");

    try {
      const response = await runWithFeedback({
        action: async () => {
          const session = await billingService.createCheckoutSession(plan.planType);

          if (!session.url) {
            throw new Error("Nao foi possivel iniciar o checkout agora.");
          }

          return session;
        },
        successTitle: "Checkout iniciado",
        successMessage: `Voce esta sendo levado para o pagamento do plano ${plan.name}.`,
        errorTitle: "Erro ao iniciar pagamento",
        errorFallbackMessage: "Nao foi possivel iniciar o checkout agora.",
        onError: async (message) => {
          setErrorMessage(message);
        }
      });
      window.location.assign(response.url);
    } catch {
      // O feedback visual ja foi tratado pelo hook.
    } finally {
      setActiveUpgrade(null);
    }
  }

  const isInactive = Boolean(subscription && isSubscriptionInactive(subscription.status));
  const isCurrentSubscription = Boolean(subscription && isSubscriptionCurrent(subscription.status));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Escolha o plano ideal para o seu negocio"
        description={`Aumente seu limite de clientes, destrave novas operacoes e evolua o ${branding.productName} no ritmo da sua carteira.`}
      />

      {errorMessage ? (
        <Card className="border border-rose-100 bg-rose-50/90 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-100">{errorMessage}</p>
        </Card>
      ) : null}

      {isInactive ? (
        <AlertBanner
          tone="warning"
          title="Sua assinatura esta inativa, mas voce pode retomar qualquer plano agora."
          description="O ultimo plano continua visivel como referencia, sem bloquear uma nova tentativa de checkout."
        />
      ) : null}

      <SubscriptionOverviewCard
        subscription={subscription}
        isLoading={isLoading}
        eyebrow="Assinatura"
        title="Estado atual da assinatura"
        description="Veja o plano ativo ou o ultimo plano usado antes de seguir para um novo checkout."
        footerMessage={
          isCurrentSubscription
            ? "Somente assinaturas ativas ou em periodo de teste travam o card correspondente como plano atual."
            : "Como a assinatura nao esta ativa, todos os planos pagos seguem disponiveis para um novo checkout."
        }
      />

      <section className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = Boolean(subscription && isCurrentSubscription && subscription.plan === plan.name);
          const isPreviousPlan = Boolean(subscription && !isCurrentSubscription && subscription.plan === plan.name);

          return (
            <Card
              key={plan.name}
              className={`relative overflow-hidden ${
                plan.featured ? "border-2 border-primary-200 bg-gradient-to-b from-white via-primary-50/70 to-white shadow-soft dark:border-primary-500/40 dark:from-slate-900 dark:via-primary-500/10 dark:to-slate-900" : ""
              }`}
            >
              {plan.featured ? (
                <div className="absolute right-5 top-5 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-primary-600/20">
                  Mais escolhido
                </div>
              ) : null}

              <div className="flex h-full flex-col space-y-6">
                <div className="space-y-5 pr-0">
                  <div className="space-y-3 pr-28 xl:pr-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">{plan.name}</h2>
                      {isPreviousPlan ? (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          Ultimo plano
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">{plan.description}</p>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-950/60">
                    <p className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">{plan.price}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Ate {plan.maxClients} clientes
                    </p>
                    {plan.featured ? (
                      <p className="mt-3 rounded-2xl bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 dark:bg-primary-500/10 dark:text-primary-200">
                        Melhor custo-beneficio para cobrar com mais agilidade.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">{plan.valueMessage}</p>
                </div>

                <div className="space-y-3">
                  {plan.benefits.map((benefit) => (
                    <div key={benefit} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        plan.featured ? "bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                      }`}>
                        <CheckIcon />
                      </span>
                      <span className="font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button
                  fullWidth
                  variant={plan.featured ? "primary" : "secondary"}
                  className="mt-auto"
                  disabled={isCurrentPlan}
                  loading={activeUpgrade === plan.planType}
                  loadingText="Processando..."
                  onClick={() => handleUpgrade(plan)}
                >
                  {isCurrentPlan ? "Plano atual" : "Fazer upgrade"}
                </Button>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
