import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";

export type ToastOptions = {
  title: string;
  message?: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

export type ToastItem = ToastOptions & {
  id: number;
};

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: number) => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ durationMs = 5000, tone = "info", ...options }: ToastOptions) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const nextToast: ToastItem = {
        id,
        tone,
        durationMs,
        ...options
      };

      setToasts((current) => [...current, nextToast]);
      window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast
    }),
    [dismissToast, showToast, toasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

