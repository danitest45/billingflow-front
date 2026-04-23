import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { branding } from "../config/branding";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { getErrorMessage } from "../services/api";

type RegisterFormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function RegisterPage() {
  usePageTitle("Criar conta");

  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm() {
    const nextErrors: RegisterFormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Informe seu nome.";
    }

    if (!email.trim()) {
      nextErrors.email = "Informe seu e-mail.";
    }

    if (password.length < 6) {
      nextErrors.password = "A senha deve ter pelo menos 6 caracteres.";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "As senhas precisam ser iguais.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Nao foi possivel criar sua conta agora."));
    } finally {
      setIsSubmitting(false);
    }
  }

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
              Comece a organizar suas cobrancas em poucos minutos.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              Crie sua conta para controlar clientes, vencimentos e pagamentos sem depender de planilhas soltas.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { value: "Gratis", label: "para comecar com calma" },
              { value: "Simples", label: "sem complicar sua rotina" },
              { value: "Claro", label: "para saber quem pagou" }
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Nova conta</p>
            <h2 className="text-3xl font-extrabold text-slate-950">Criar conta</h2>
            <p className="text-sm text-slate-500">Preencha seus dados para entrar no {branding.productName}.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Nome"
              placeholder="Seu nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={errors.name}
              required
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="voce@billingflow.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Minimo de 6 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
              required
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={errors.confirmPassword}
              required
            />

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <Button type="submit" fullWidth loading={isSubmitting}>
              Criar conta
            </Button>

            <p className="text-center text-sm text-slate-500">
              Ja tem conta?{" "}
              <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/login">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
