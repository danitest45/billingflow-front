import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { PageHeader } from "../components/common/PageHeader";
import { branding } from "../config/branding";
import { useApiFeedback } from "../hooks/useApiFeedback";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { supportService } from "../services/support";

type SupportFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type SupportFormErrors = {
  name?: string;
  email?: string;
  message?: string;
};

const emptyForm: SupportFormData = {
  name: "",
  email: "",
  subject: "",
  message: ""
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SupportPage() {
  usePageTitle("Suporte");

  const { isAuthenticated } = useAuth();
  const { runWithFeedback } = useApiFeedback();
  const [formData, setFormData] = useState<SupportFormData>(emptyForm);
  const [errors, setErrors] = useState<SupportFormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof SupportFormData>(field: K, value: SupportFormData[K]) {
    setFormData((current) => ({ ...current, [field]: value }));

    if (field === "name" || field === "email" || field === "message") {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function validateForm() {
    const nextErrors: SupportFormErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Informe seu nome.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!isValidEmail(formData.email.trim())) {
      nextErrors.email = "Informe um e-mail valido.";
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Escreva sua mensagem para o suporte.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await runWithFeedback({
        action: () =>
          supportService.sendSupportMessage({
            name: formData.name.trim(),
            email: formData.email.trim(),
            subject: formData.subject.trim(),
            message: formData.message.trim()
          }),
        successTitle: "Mensagem enviada",
        successMessage: (result) => result.message,
        errorTitle: "Erro ao enviar mensagem",
        errorFallbackMessage: "Nao foi possivel enviar sua mensagem agora. Tente novamente em instantes.",
        onError: async (message) => {
          setErrorMessage(message);
        }
      });

      setSuccessMessage(response.message);
      setFormData(emptyForm);
      setErrors({});
    } catch {
      // O feedback visual ja foi tratado pelo hook.
    } finally {
      setIsSubmitting(false);
    }
  }

  const formElement = (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Input
        label="Nome"
        placeholder="Seu nome"
        value={formData.name}
        onChange={(event) => updateField("name", event.target.value)}
        error={errors.name}
        required
      />
      <Input
        label="E-mail"
        type="email"
        placeholder="voce@cobrancaflow.com"
        value={formData.email}
        onChange={(event) => updateField("email", event.target.value)}
        error={errors.email}
        required
      />
      <Input
        label="Assunto"
        placeholder="Ex.: Duvida sobre assinatura"
        value={formData.subject}
        onChange={(event) => updateField("subject", event.target.value)}
      />

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mensagem</span>
        <textarea
          className={`min-h-[180px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/20 ${errors.message ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/60 dark:focus:border-rose-500 dark:focus:ring-rose-500/20" : ""}`}
          placeholder="Descreva sua duvida, sugestao ou problema."
          value={formData.message}
          onChange={(event) => updateField("message", event.target.value)}
          required
        />
        {errors.message ? <span className="text-sm text-rose-600 dark:text-rose-300">{errors.message}</span> : null}
      </label>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          {successMessage}
        </div>
      ) : null}

      <Button type="submit" fullWidth loading={isSubmitting} loadingText="Enviando...">
        Enviar mensagem
      </Button>
    </form>
  );

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.45),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.25),_transparent_22%)]" />
        <Link
          to="/"
          className="absolute left-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg shadow-slate-950/20 backdrop-blur-md transition hover:bg-white/20 sm:left-6 sm:top-6"
          aria-label="Voltar para a pagina inicial"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>

        <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="space-y-8 text-white">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-100">
              {branding.productName}
            </span>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Fale com o suporte quando precisar.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-300">
                Envie sua duvida, sugestao ou problema. Responderemos assim que possivel.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { value: "Duvida", label: "sobre planos, cobrancas ou configuracoes" },
                { value: "Sugestao", label: "para evoluir o produto com sua rotina" },
                { value: "Ajuda", label: "para resolver algum problema rapidamente" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md"
                >
                  <p className="text-2xl font-extrabold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel mx-auto w-full max-w-md p-8">
            <div className="mb-8 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Suporte</p>
              <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white">Fale com o suporte</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Envie sua duvida, sugestao ou problema. Responderemos assim que possivel.
              </p>
            </div>

            {formElement}

            <p className="mt-5 text-center text-sm text-slate-500">
              Ja quer entrar?{" "}
              <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/login">
                Acessar a plataforma
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fale com o suporte"
        description="Envie sua duvida, sugestao ou problema. Responderemos assim que possivel."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>{formElement}</Card>

        <Card>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                Atendimento
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">
                Conte o que esta acontecendo
              </h2>
            </div>

            <div className="space-y-3">
              {[
                "Duvidas sobre assinatura, upgrade e limite de clientes",
                "Problemas com cobrancas, pagamentos ou WhatsApp",
                "Sugestoes para melhorar sua rotina no produto"
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                Quanto mais contexto voce enviar, mais rapido conseguimos ajudar.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
