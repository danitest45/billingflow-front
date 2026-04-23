import { Link } from "react-router-dom";
import { branding } from "../config/branding";
import { usePageTitle } from "../hooks/usePageTitle";

const painPoints = [
  "Controlar cobrancas em planilhas espalhadas",
  "Esquecer vencimentos importantes",
  "Perder visibilidade do fluxo de caixa",
  "Nao saber rapidamente quem pagou ou nao"
];

const features = [
  {
    title: "Clientes organizados",
    description: "Guarde dados, valores mensais e vencimentos de cada cliente em um unico lugar."
  },
  {
    title: "Cobrancas no controle",
    description: "Gere cobrancas quando precisar e acompanhe o que ainda esta em aberto."
  },
  {
    title: "Resumo financeiro claro",
    description: "Veja quanto voce tem a receber, quanto ja recebeu e o que esta atrasado."
  },
  {
    title: "Menos tarefas repetidas",
    description: "Reduza controles manuais e ganhe mais previsibilidade na rotina de cobrancas."
  },
  {
    title: "Atrasos visiveis",
    description: "Identifique rapidamente quem ainda nao pagou e evite perder dinheiro por esquecimento."
  },
  {
    title: "Cresce com seu negocio",
    description: "Comece pequeno e aumente seu limite de clientes conforme sua carteira crescer."
  }
];

const steps = [
  {
    title: "Cadastre seus clientes",
    description: "Informe nome, contato, valor mensal e dia de vencimento de cada cliente."
  },
  {
    title: "Acompanhe pagamentos",
    description: "Veja o que esta pago, pendente ou atrasado sem procurar em planilhas."
  },
  {
    title: "Mantenha a rotina em ordem",
    description: `Use o ${branding.productName} como seu painel diario para nao deixar cobrancas passarem.`
  }
];

const plans = [
  {
    name: "Trial",
    price: "Gratis",
    description: "Experimente antes de escolher um plano.",
    clients: "para comecar"
  },
  {
    name: "Starter",
    price: "R$29,90",
    description: "Ideal para quem esta organizando os primeiros clientes.",
    clients: "ate 10 clientes"
  },
  {
    name: "Pro",
    price: "R$59,90",
    description: "Para freelancers e pequenas equipes que ja cobram todo mes.",
    clients: "ate 30 clientes",
    featured: true
  },
  {
    name: "Agency",
    price: "R$99,90",
    description: "Para agencias com mais clientes e rotina de cobranca ativa.",
    clients: "ate 100 clientes"
  }
];

function BrandLogo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-400 text-sm font-extrabold text-white shadow-lg shadow-primary-950/20">
        {branding.shortName}
      </div>
      <div>
        <p className="text-base font-extrabold text-white">{branding.productName}</p>
        <p className="text-xs font-medium text-slate-400">{branding.productTagline}</p>
      </div>
    </Link>
  );
}

function PublicLinkButton({
  to,
  children,
  variant = "primary"
}: {
  to: string;
  children: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary:
      "bg-primary-600 text-white shadow-lg shadow-blue-600/20 hover:bg-primary-700",
    secondary:
      "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800",
    ghost:
      "border border-slate-200 bg-white/75 text-slate-700 hover:bg-white"
  };

  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${styles[variant]}`}
    >
      {children}
    </Link>
  );
}

export function LandingPage() {
  usePageTitle(branding.productName);

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo />

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-300 lg:flex">
            <a className="transition hover:text-white" href="#recursos">
              Recursos
            </a>
            <a className="transition hover:text-white" href="#como-funciona">
              Como funciona
            </a>
            <a className="transition hover:text-white" href="#planos">
              Planos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link className="hidden text-sm font-semibold text-slate-300 transition hover:text-white sm:inline" to="/login">
              Entrar
            </Link>
            <PublicLinkButton to="/register">Comecar gratis</PublicLinkButton>
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.45),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.25),_transparent_22%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-24">
            <div className="space-y-8">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-100 shadow-sm backdrop-blur-md">
                Controle de cobrancas
              </span>

              <div className="space-y-6">
                <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                  {branding.productName}: controle suas cobrancas sem planilha e sem dor de cabeca.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  {branding.tagline}. Organize clientes, acompanhe pagamentos, lembre vencimentos e mantenha a rotina
                  financeira mais previsivel.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <PublicLinkButton to="/register">Comecar gratis</PublicLinkButton>
                <PublicLinkButton to="/login" variant="ghost">
                  Entrar
                </PublicLinkButton>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "Resumo do dinheiro a receber",
                  "Clientes sempre organizados",
                  "Menos esquecimentos"
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 shadow-sm backdrop-blur-md">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-primary-500/20 to-emerald-400/20 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-soft backdrop-blur-xl">
                <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-200">Resumo</p>
                      <h2 className="mt-2 text-2xl font-extrabold text-white">Seu mes em dia</h2>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Em dia
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      ["A receber", "R$ 8.400"],
                      ["Recebido", "R$ 6.900"],
                      ["Pendente", "R$ 1.500"],
                      ["Atrasados", "3"]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
                        <p className="mt-2 text-2xl font-extrabold text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                      <span>Cliente</span>
                      <span>Status</span>
                    </div>
                    {[
                      ["Estudio Aurora", "Pago"],
                      ["Agencia Alpha", "Pendente"],
                      ["Studio Gamma", "Atrasado"]
                    ].map(([client, status]) => (
                      <div key={client} className="flex items-center justify-between py-3 text-sm">
                        <span className="font-semibold text-white">{client}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">O problema</p>
              <h2 className="mt-4 text-3xl font-extrabold text-white">Cobrar cliente no improviso custa tempo e dinheiro.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Quando tudo fica em planilha, mensagem solta ou memoria, fica facil esquecer vencimentos e perder
                visibilidade do caixa.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {painPoints.map((item) => (
                <div key={item} className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur-md">
                  <p className="text-lg font-bold text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="recursos" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-200">Recursos</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-white">Tudo que voce precisa para cobrar com mais tranquilidade.</h2>
            <p className="text-base leading-7 text-slate-300">
              Organize clientes, acompanhe pagamentos e tenha uma visao clara do que entra no caixa.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/15 hover:shadow-soft">
                <div className="mb-5 h-2 w-16 rounded-full bg-gradient-to-r from-primary-600 to-emerald-400" />
                <h3 className="text-xl font-extrabold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-8 shadow-soft backdrop-blur-xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-200">Como funciona</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white">Um fluxo simples em 3 passos.</h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-extrabold text-slate-950">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-extrabold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              ["Clientes", "Clientes, valores e vencimentos sempre organizados."],
              ["Cobrancas", "Status simples para saber quem pagou, quem esta pendente e quem atrasou."],
              ["Planos", "Limite de clientes que acompanha o tamanho do seu negocio."]
            ].map(([title, description]) => (
              <div key={title} className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-sm backdrop-blur-md">
                <div className="rounded-3xl bg-slate-950 p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
                  <div className="mt-5 space-y-3">
                    <div className="h-3 rounded-full bg-white/20" />
                    <div className="h-3 w-4/5 rounded-full bg-white/15" />
                    <div className="h-3 w-3/5 rounded-full bg-primary-400/60" />
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="planos" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-200">Planos</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white">Comece gratis e escolha um plano quando fizer sentido.</h2>
            </div>
            <PublicLinkButton to="/register" variant="secondary">
              Criar conta gratis
            </PublicLinkButton>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[2rem] border bg-white/10 p-6 shadow-sm backdrop-blur-md ${
                  plan.featured ? "border-primary-400/50 ring-4 ring-primary-500/15" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-extrabold text-white">{plan.name}</h3>
                  {plan.featured ? (
                    <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                      Mais escolhido
                    </span>
                  ) : null}
                </div>
                <p className="mt-5 text-3xl font-extrabold text-white">{plan.price}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{plan.clients}</p>
                <p className="mt-5 text-sm leading-6 text-slate-300">{plan.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[2.5rem] bg-slate-950 p-8 text-center shadow-soft sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-200">Pronto para comecar?</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white">
              Comece hoje a organizar suas cobrancas.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Crie sua conta gratis e veja seus clientes, vencimentos e pagamentos em um unico lugar.
            </p>
            <div className="mt-8">
              <PublicLinkButton to="/register">Criar conta gratis</PublicLinkButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <BrandLogo />
          <div className="flex flex-wrap gap-5 text-sm font-semibold text-slate-400">
            <Link className="hover:text-white" to="/login">
              Entrar
            </Link>
            <Link className="hover:text-white" to="/register">
              Criar conta
            </Link>
            <span>Termos</span>
            <span>Privacidade</span>
            <span>Contato</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
