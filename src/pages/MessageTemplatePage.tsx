import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { whatsAppPremiumBenefits } from "../components/subscription/WhatsAppUpgradeModal";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../services/api";
import { messageTemplateService } from "../services/messageTemplate";
import { subscriptionService } from "../services/subscription";
import type { SubscriptionInfo } from "../types/domain";
import { canUseWhatsApp, formatSubscriptionPlan } from "../utils/format";

const availableVariables = ["[nome]", "[valor]", "[vencimento]"];

function buildPreview(template: string) {
  const baseTemplate = template.trim() || "Olá [nome], sua cobrança de [valor] vence em [vencimento].";

  return baseTemplate
    .split("[nome]").join("João")
    .split("[valor]").join("R$ 500,00")
    .split("[vencimento]").join("20/04/2026");
}

export function MessageTemplatePage() {
  usePageTitle("Mensagem de cobranca");

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [chargeTemplate, setChargeTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPageData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const subscriptionResponse = await subscriptionService.getDetails();
        setSubscription(subscriptionResponse);

        if (canUseWhatsApp(subscriptionResponse.plan)) {
          const templateResponse = await messageTemplateService.getCurrent();
          setChargeTemplate(templateResponse.chargeTemplate ?? "");
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Nao foi possivel carregar a mensagem de cobranca."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadPageData();
  }, []);

  const previewMessage = useMemo(() => buildPreview(chargeTemplate), [chargeTemplate]);
  const canEditTemplate = Boolean(subscription && canUseWhatsApp(subscription.plan));

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!chargeTemplate.trim()) {
      setErrorMessage("Informe uma mensagem para salvar.");
      return;
    }

    setIsSaving(true);

    try {
      await messageTemplateService.update({
        chargeTemplate: chargeTemplate.trim()
      });
      setChargeTemplate(chargeTemplate.trim());
      showToast({
        tone: "success",
        title: "Mensagem salva",
        message: "A mensagem de cobranca foi atualizada com sucesso."
      });
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel salvar a mensagem de cobranca agora.");
      setErrorMessage(message);
      showToast({
        tone: "error",
        title: "Falha ao salvar mensagem",
        message
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mensagem de cobranca"
        description="Edite a mensagem usada para cobrar seus clientes pelo WhatsApp a partir da tela de cobrancas."
      />

      {errorMessage ? (
        <Card className="border border-rose-100 bg-rose-50/90 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-100">{errorMessage}</p>
        </Card>
      ) : null}

      {!isLoading && subscription && !canEditTemplate ? (
        <Card className="overflow-hidden border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/80 dark:border-emerald-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-500/10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                Recurso premium
              </span>
              <div className="space-y-3">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                  Cobranca via WhatsApp esta disponivel a partir do plano Starter.
                </h2>
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
                  Seu plano atual: {formatSubscriptionPlan(subscription.plan)}. Faca upgrade para editar mensagens prontas
                  e cobrar clientes pelo WhatsApp com mais agilidade.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate("/upgrade")}>Fazer upgrade</Button>
                <Button variant="ghost" onClick={() => navigate("/invoices")}>
                  Voltar para cobrancas
                </Button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/80 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/50">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                O que voce libera
              </p>
              <div className="mt-5 grid gap-3">
                {whatsAppPremiumBenefits.map((benefit) => (
                  <div key={benefit} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {canEditTemplate ? (
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <form className="space-y-6" onSubmit={handleSave}>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Template da mensagem
              </span>
              <textarea
                className="min-h-[260px] w-full resize-y rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/20"
                placeholder="Ex.: Ola [nome], sua cobranca de [valor] vence em [vencimento]. Posso te ajudar com o pagamento?"
                value={chargeTemplate}
                onChange={(event) => setChargeTemplate(event.target.value)}
                disabled={isLoading}
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Use as variaveis para personalizar cada cobranca automaticamente.
              </p>
              <Button type="submit" loading={isSaving} disabled={isLoading}>
                Salvar mensagem
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                  Variaveis disponiveis
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                  Personalizacao automatica
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableVariables.map((variable) => (
                  <span
                    key={variable}
                    className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-200"
                  >
                    {variable}
                  </span>
                ))}
              </div>

              <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
                Na hora de cobrar, o sistema troca essas variaveis pelos dados reais da fatura antes de abrir o WhatsApp.
              </p>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                  Previa simples
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                  Como a mensagem pode aparecer
                </h2>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <p className="whitespace-pre-wrap text-sm leading-7 text-emerald-950 dark:text-emerald-100">
                  {isLoading ? "Carregando previa..." : previewMessage}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      ) : null}
    </div>
  );
}
