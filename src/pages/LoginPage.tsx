import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { getErrorMessage } from "../services/api";

export function LoginPage() {
  usePageTitle("Login");

  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Nao foi possivel realizar o login agora."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.45),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.25),_transparent_22%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-8 text-white">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-100">
            BillingFlow
          </span>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Cobrancas mensais organizadas para freelancers e agencias pequenas.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              Monitore clientes, receitas esperadas, inadimplencia e fluxo de caixa em uma experiencia
              limpa, rapida e pronta para escalar seu MVP.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { value: "4x", label: "menos retrabalho com cobrancas" },
              { value: "100%", label: "rotas privadas com JWT" },
              { value: "MVP", label: "layout SaaS pronto para producao" }
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Acesso seguro</p>
            <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white">Entrar na plataforma</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">Use suas credenciais para acessar clientes e cobrancas.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="E-mail"
              type="email"
              placeholder="voce@billingflow.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
                {errorMessage}
              </div>
            ) : null}

            <Button type="submit" fullWidth loading={isSubmitting}>
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
