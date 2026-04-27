import { useState, type ReactNode, type SVGProps } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { branding } from "../../config/branding";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "../common/ThemeToggle";

type AppShellProps = {
  children: ReactNode;
};

type IconProps = SVGProps<SVGSVGElement>;

function DashboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 13.5h8V3H3zM13 21h8v-6h-8zM13 11h8V3h-8zM3 21h8v-5.5H3z" />
    </svg>
  );
}

function ClientsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function InvoiceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5M10 13h6M10 17h4" />
    </svg>
  );
}

function SubscriptionIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  );
}

function MessageIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.5-4A8 8 0 1 1 21 12z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function SupportIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.3a2.6 2.6 0 1 1 4.9 1.2c-.4.8-1.2 1.2-1.8 1.7-.5.3-.9.8-.9 1.5" />
      <circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function LogoutIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
      <path d="M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/clients", label: "Clientes", icon: ClientsIcon },
  { to: "/invoices", label: "Cobrancas", icon: InvoiceIcon },
  { to: "/message-template", label: "Mensagem", icon: MessageIcon },
  { to: "/support", label: "Suporte", icon: SupportIcon },
  { to: "/subscription", label: "Assinatura", icon: SubscriptionIcon }
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout, session } = useAuth();
  const navigate = useNavigate();
  const userEmail = session?.email?.trim();
  const userInitial = userEmail?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-400 text-lg font-extrabold text-white shadow-lg shadow-primary-950/20">
              {branding.shortName}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-white">{branding.productName}</p>
              <p className="truncate text-sm text-slate-300">{branding.productTagline}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-slate-900 shadow-lg shadow-slate-950/10"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white ring-1 ring-white/10">
          {userInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white" title={userEmail || "Usuario logado"}>
            {userEmail || "Usuario logado"}
          </p>
          <p className="text-xs text-slate-400">Conta autenticada</p>
        </div>
        <button
          type="button"
          title="Sair"
          aria-label="Sair"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          <LogoutIcon className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[290px] border-r border-white/10 bg-slate-950 px-6 py-8 dark:border-slate-800 dark:bg-slate-950 lg:block">
        <SidebarContent />
      </aside>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="h-full w-[min(18rem,calc(100vw-1rem))] overflow-y-auto bg-slate-950 px-5 py-6 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[290px]">
        <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0 pr-3">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 sm:tracking-[0.24em] dark:text-primary-300">Controle financeiro</p>
              <h1 className="truncate text-base font-bold text-slate-950 sm:text-lg dark:text-white">Gestao de clientes e recorrencia</h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="space-y-6 sm:space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
