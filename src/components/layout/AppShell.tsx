import { useState, type ReactNode, type SVGProps } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../common/Button";

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

function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/clients", label: "Clientes", icon: ClientsIcon },
  { to: "/invoices", label: "Cobrancas", icon: InvoiceIcon },
  { to: "/subscription", label: "Assinatura", icon: SubscriptionIcon }
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-400 text-lg font-extrabold text-white shadow-lg shadow-primary-950/20">
              BF
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">BillingFlow</p>
              <p className="text-sm text-slate-300">Cobrancas com visao de negocio</p>
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

      <div className="mt-auto space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <div>
          <p className="text-sm font-semibold text-slate-300">Sessao ativa</p>
          <p className="mt-1 text-sm text-white">Conta autenticada e pronta para uso.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-300">
          {location.pathname.replace("/", "") || "dashboard"}
        </div>
        <Button
          variant="ghost"
          fullWidth
          className="border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          Sair
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[290px] border-r border-white/10 bg-slate-950 px-6 py-8 dark:border-slate-800 dark:bg-slate-950 lg:block">
        <SidebarContent />
      </aside>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="h-full w-[280px] bg-slate-950 px-6 py-8 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[290px]">
        <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700 dark:text-primary-300">SaaS Financeiro</p>
              <h1 className="text-lg font-bold text-slate-950 dark:text-white">Gestao de clientes e recorrencia</h1>
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
