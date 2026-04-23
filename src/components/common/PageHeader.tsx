import type { ReactNode } from "react";
import { branding } from "../../config/branding";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <span className="inline-flex rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-200">
          {branding.productName}
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-300">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
