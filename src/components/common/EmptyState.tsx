import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-10 text-center sm:px-6 sm:py-12 dark:border-slate-700 dark:bg-slate-900/70">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-300">{description}</p>
      {action ? <div className="mt-5 flex justify-center [&>button]:w-full sm:[&>button]:w-auto">{action}</div> : null}
    </div>
  );
}
