import type { ReactNode } from "react";

type AlertBannerProps = {
  title: string;
  description?: string;
  tone?: "info" | "warning" | "danger" | "success";
  action?: ReactNode;
};

const toneStyles = {
  info: "border-primary-100 bg-primary-50/90 text-primary-900 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-100",
  warning: "border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
  danger: "border-rose-200 bg-rose-50/90 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100",
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
} as const;

export function AlertBanner({
  title,
  description,
  tone = "info",
  action
}: AlertBannerProps) {
  return (
    <div className={`rounded-3xl border px-5 py-4 ${toneStyles[tone]}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
