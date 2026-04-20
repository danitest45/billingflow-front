import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { usePageTitle } from "../hooks/usePageTitle";

export function BillingCancelPage() {
  usePageTitle("Pagamento cancelado");

  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pagamento cancelado"
        description="Voce pode tentar novamente quando quiser."
      />

      <Card className="max-w-3xl">
        <div className="space-y-6">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Nenhuma alteracao foi feita na sua assinatura. Quando quiser, escolha um plano novamente para retomar o checkout.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate("/upgrade")}>Voltar para upgrade</Button>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Ir para dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
