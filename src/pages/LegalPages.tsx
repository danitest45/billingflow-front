import { Link } from "react-router-dom";
import { branding } from "../config/branding";
import { usePageTitle } from "../hooks/usePageTitle";

type LegalSection = {
  title: string;
  text: string;
};

type LegalPageProps = {
  title: string;
  description: string;
  sections: LegalSection[];
};

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

function LegalLayout({ title, description, sections }: LegalPageProps) {
  usePageTitle(`${title} | ${branding.productName}`);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo />
          <nav className="flex items-center gap-4 text-sm font-semibold text-slate-300">
            <Link className="transition hover:text-white" to="/">
              Início
            </Link>
            <Link className="transition hover:text-white" to="/support">
              Suporte
            </Link>
          </nav>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <article className="mx-auto max-w-[700px] rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-soft backdrop-blur-xl sm:p-10">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-200">
              {branding.productName}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{title}</h1>
            <p className="text-base leading-7 text-slate-300">{description}</p>
          </div>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-xl font-extrabold text-white">{section.title}</h2>
                <p className="text-base leading-8 text-slate-300">{section.text}</p>
              </section>
            ))}
          </div>
        </article>
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
            <Link className="hover:text-white" to="/support">
              Suporte
            </Link>
            <Link className="hover:text-white" to="/termos">
              Termos
            </Link>
            <Link className="hover:text-white" to="/privacidade">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Termos de Uso"
      description="Leia as principais condições para utilizar o CobrançaFlow com clareza."
      sections={[
        {
          title: "Descrição do serviço",
          text: "O CobrançaFlow é uma ferramenta para organização de clientes e cobranças."
        },
        {
          title: "Uso do serviço",
          text: "O usuário é responsável pelas informações inseridas no sistema."
        },
        {
          title: "Pagamentos",
          text: "O uso do sistema é baseado em assinatura mensal, podendo ser cancelado a qualquer momento."
        },
        {
          title: "Responsabilidade",
          text: "O sistema não se responsabiliza por falhas externas como serviços de terceiros."
        },
        {
          title: "Alterações",
          text: "Os termos podem ser atualizados a qualquer momento."
        }
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      description="Entenda quais dados usamos e como eles ajudam o CobrançaFlow a funcionar."
      sections={[
        {
          title: "Dados coletados",
          text: "Nome, e-mail, telefone e dados relacionados aos clientes cadastrados."
        },
        {
          title: "Uso dos dados",
          text: "Os dados são utilizados apenas para funcionamento do sistema."
        },
        {
          title: "Compartilhamento",
          text: "Não compartilhamos dados com terceiros, exceto quando necessário para funcionamento, como Stripe."
        },
        {
          title: "Segurança",
          text: "Adotamos boas práticas para proteger os dados."
        },
        {
          title: "Direitos do usuário",
          text: "O usuário pode solicitar exclusão de dados."
        }
      ]}
    />
  );
}
