import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { usePageTitle } from "../hooks/usePageTitle";

export function BillingSuccessPage() {
  usePageTitle("Pagamento iniciado");

  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pagamento iniciado com sucesso"
        description="Estamos confirmando sua assinatura. Se necessario, atualize a pagina em alguns segundos."
      />

      <Card className="max-w-3xl">
        <div className="space-y-6">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/95 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Assim que o BillingFlow receber a confirmacao do pagamento, seu plano e seus limites serao atualizados.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate("/dashboard")}>Voltar ao dashboard</Button>
            <Button variant="ghost" onClick={() => navigate("/clients")}>
              Ir para clientes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
