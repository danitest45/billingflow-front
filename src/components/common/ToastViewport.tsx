import { Button } from "./Button";
import { useToast } from "../../hooks/useToast";

const toneStyles = {
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  error: "border-rose-200 bg-rose-50/95 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100",
  info: "border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
};

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-3xl border px-4 py-4 shadow-soft backdrop-blur-xl ${toneStyles[toast.tone ?? "info"]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-bold">{toast.title}</p>
              {toast.message ? <p className="text-sm text-current/80">{toast.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-full px-2 py-1 text-xs font-semibold text-current/70 transition hover:bg-black/5 hover:text-current"
            >
              Fechar
            </button>
          </div>

          {toast.actionLabel && toast.onAction ? (
            <div className="mt-4">
              <Button
                variant="ghost"
                className="border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/10"
                onClick={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
              >
                {toast.actionLabel}
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
