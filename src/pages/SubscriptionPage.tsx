import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertBanner } from "../components/common/AlertBanner";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { SubscriptionOverviewCard } from "../components/subscription/SubscriptionOverviewCard";
import { branding } from "../config/branding";
import { useCustomerPortal } from "../hooks/useCustomerPortal";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../services/api";
import { subscriptionService } from "../services/subscription";
import type { SubscriptionInfo } from "../types/domain";
import { formatSubscriptionPlan, isSubscriptionInactive } from "../utils/format";

export function SubscriptionPage() {
  usePageTitle("Assinatura");

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isOpeningPortal, openCustomerPortal } = useCustomerPortal();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const isInactive = Boolean(subscription && isSubscriptionInactive(subscription.status));
  const planName = subscription ? formatSubscriptionPlan(subscription.plan) : "";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assinatura"
        description={`Centralize o plano atual, acompanhe limites da conta e tenha um caminho claro para evoluir seu ${branding.productName}.`}
      />

      {errorMessage ? (
        <Card className="border border-rose-100 bg-rose-50/90 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-100">{errorMessage}</p>
        </Card>
      ) : null}

      {isInactive ? (
        <AlertBanner
          tone="warning"
          title="Sua assinatura esta inativa. Faca upgrade para continuar."
          description="Retome seu plano quando quiser para liberar cadastro de clientes e operacoes de cobranca."
          action={
            <Button variant="secondary" onClick={() => navigate("/upgrade")}>
              Fazer upgrade
            </Button>
          }
        />
      ) : null}

      <SubscriptionOverviewCard
        subscription={subscription}
        isLoading={isLoading}
        title="Area de assinatura e plano"
        description="Veja o estado atual da sua conta, o consumo de clientes e os proximos passos de faturamento."
        footerMessage={
          !subscription && !isLoading
            ? "Nao foi possivel identificar um plano agora. Tente atualizar a pagina em alguns instantes."
            : isInactive
            ? "Seu ultimo plano permanece registrado, mas a conta precisa de um novo checkout para voltar a operar normalmente."
            : `Seu limite atual acompanha o plano ${planName} e fica disponivel assim que a assinatura estiver ativa.`
        }
        primaryAction={
          <Button onClick={() => navigate("/upgrade")}>
            Fazer upgrade
          </Button>
        }
        secondaryAction={
          <Button
            variant="ghost"
            loading={isOpeningPortal}
            loadingText="Abrindo..."
            onClick={openCustomerPortal}
          >
            Gerenciar assinatura
          </Button>
        }
      />
    </div>
  );
}
