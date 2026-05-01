import type { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  hideCloseButton?: boolean;
  size?: "md" | "lg";
}>;

export function Modal({ open, title, description, onClose, hideCloseButton = false, size = "md", children }: ModalProps) {
  if (!open) {
    return null;
  }

  const sizeClass = size === "lg" ? "max-w-5xl" : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className={`max-h-[calc(100vh-4rem)] w-full overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900 ${sizeClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">{description}</p>
          </div>
          {!hideCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Fechar
            </button>
          ) : null}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
