import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ToastViewport } from "./components/common/ToastViewport";
import { branding } from "./config/branding";
import { useAuth } from "./hooks/useAuth";
import { BillingCancelPage } from "./pages/BillingCancelPage";
import { BillingSuccessPage } from "./pages/BillingSuccessPage";
import { ClientsPage } from "./pages/ClientsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MessageTemplatePage } from "./pages/MessageTemplatePage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { UpgradePage } from "./pages/UpgradePage";

function ProtectedApp() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200 dark:bg-slate-950">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 dark:border-slate-700 dark:bg-slate-900/70">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          Carregando {branding.productName}...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/message-template" element={<MessageTemplatePage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/upgrade" element={<UpgradePage />} />
        <Route path="/billing/success" element={<BillingSuccessPage />} />
        <Route path="/billing/cancel" element={<BillingCancelPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
        />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
      <ToastViewport />
    </>
  );
}
