import { useEffect, useState } from "react";
import { AlertBanner } from "../components/common/AlertBanner";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { SubscriptionOverviewCard } from "../components/subscription/SubscriptionOverviewCard";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
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
  maxClients: number;
  featured?: boolean;
};

const plans: PlanCard[] = [
  {
    name: "Starter",
    planType: 2,
    price: "R$29,90 / mes",
    description: "Ideal para profissionais autonomos",
    maxClients: 10
  },
  {
    name: "Pro",
    planType: 3,
    price: "R$59,90 / mes",
    description: "Perfeito para freelancers e pequenas operacoes",
    maxClients: 30,
    featured: true
  },
  {
    name: "Agency",
    planType: 4,
    price: "R$99,90 / mes",
    description: "Para operacoes com maior volume de clientes",
    maxClients: 100
  }
];

export function UpgradePage() {
  usePageTitle("Upgrade de plano");

  const { showToast } = useToast();
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
      const response = await billingService.createCheckoutSession(plan.planType);

      if (!response.url) {
        throw new Error("Nao foi possivel iniciar o checkout agora.");
      }

      showToast({
        tone: "info",
        title: "Redirecionando para o pagamento",
        message: `Voce esta sendo levado para o checkout do plano ${plan.name}.`
      });
      window.location.assign(response.url);
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel iniciar o checkout agora.");
      setErrorMessage(message);
      showToast({
        tone: "error",
        title: "Falha ao iniciar pagamento",
        message
      });
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
        description="Aumente seu limite de clientes, destrave novas operacoes e evolua o BillingFlow no ritmo da sua carteira."
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
              className={`overflow-hidden ${
                plan.featured ? "border-2 border-primary-200 bg-gradient-to-b from-white to-primary-50/60 dark:border-primary-500/40 dark:from-slate-900 dark:to-primary-500/10" : ""
              }`}
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">{plan.name}</h2>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {isPreviousPlan ? (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          Ultimo plano
                        </span>
                      ) : null}
                      {plan.featured ? (
                        <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                          Mais escolhido
                        </span>
                      ) : null}
                      <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-300">
                        Ate {plan.maxClients} clientes
                      </span>
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-950 dark:text-white">{plan.price}</p>
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">{plan.description}</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">Esse plano acompanha o crescimento da sua operacao.</p>
                  <p className="mt-2">
                    Tenha mais margem para cadastrar clientes e manter a rotina financeira sem travas.
                  </p>
                </div>

                <Button
                  fullWidth
                  variant={plan.featured ? "primary" : "secondary"}
                  disabled={isCurrentPlan}
                  loading={activeUpgrade === plan.planType}
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
