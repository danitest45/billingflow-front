import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { branding } from "../config/branding";
import { useApiFeedback } from "../hooks/useApiFeedback";
import { usePageTitle } from "../hooks/usePageTitle";
import { authService } from "../services/api";

type ResetPasswordFormErrors = {
  password?: string;
  confirmPassword?: string;
};

export function ResetPasswordPage() {
  usePageTitle("Redefinir senha");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const { runWithFeedback } = useApiFeedback();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm() {
    const nextErrors: ResetPasswordFormErrors = {};

    if (!password) {
      nextErrors.password = "Informe sua nova senha.";
    } else if (password.length < 6) {
      nextErrors.password = "A senha deve ter pelo menos 6 caracteres.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirme sua nova senha.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "As senhas precisam ser iguais.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("Link invalido ou incompleto.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await runWithFeedback({
        action: () =>
          authService.resetPassword({
            token,
            newPassword: password
          }),
        successTitle: "Senha redefinida com sucesso",
        successMessage: (result) => result.message,
        errorTitle: "Erro ao redefinir senha",
        errorFallbackMessage: "Nao foi possivel redefinir sua senha agora.",
        onError: async (message) => {
          setErrorMessage(message);
        }
      });

      setSuccessMessage(response.message);
      setPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch {
      // O feedback visual ja foi tratado pelo hook.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.45),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.25),_transparent_22%)]" />
      <Link
        to="/login"
        className="absolute left-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg shadow-slate-950/20 backdrop-blur-md transition hover:bg-white/20 sm:left-6 sm:top-6"
        aria-label="Voltar para o login"
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
              Crie uma nova senha com seguranca.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              Use o link recebido no e-mail para redefinir sua senha e voltar a acessar sua operacao com tranquilidade.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { value: "6+", label: "caracteres para nova senha" },
              { value: "Seguro", label: "link validado pelo sistema" },
              { value: "Direto", label: "volta rapida para o login" }
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Redefinir senha</p>
            <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white">Escolha sua nova senha</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Informe a nova senha para finalizar a redefinicao.
            </p>
          </div>

          {!token ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                Link invalido ou incompleto.
              </div>
              <Button fullWidth onClick={() => navigate("/forgot-password")}>
                Solicitar novo link
              </Button>
              <p className="text-center text-sm text-slate-500">
                <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/login">
                  Voltar ao login
                </Link>
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Nova senha"
                type="password"
                placeholder="Minimo de 6 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
                required
              />
              <Input
                label="Confirmar nova senha"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={errors.confirmPassword}
                required
              />

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

              <Button type="submit" fullWidth loading={isSubmitting} loadingText="Redefinindo...">
                Redefinir senha
              </Button>

              <div className="space-y-2 text-center text-sm text-slate-500">
                {successMessage ? (
                  <p>
                    <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/login">
                      Entrar
                    </Link>
                  </p>
                ) : null}
                <p>
                  <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/login">
                    Voltar ao login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
