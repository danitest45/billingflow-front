import type { ReactNode } from "react";
import { Card } from "../common/Card";
import type { SubscriptionInfo } from "../../types/domain";
import {
  formatDate,
  formatSubscriptionPlan,
  formatSubscriptionStatus,
  getSubscriptionStatusTone,
  isSubscriptionCurrent
} from "../../utils/format";

type SubscriptionOverviewCardProps = {
  subscription: SubscriptionInfo | null;
  isLoading?: boolean;
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  footerMessage?: string;
};

export function SubscriptionOverviewCard({
  subscription,
  isLoading = false,
  eyebrow = "Assinatura",
  title,
  description,
  primaryAction,
  secondaryAction,
  footerMessage
}: SubscriptionOverviewCardProps) {
  const isCurrentPlan = subscription ? isSubscriptionCurrent(subscription.status) : true;
  const planLabel = isCurrentPlan ? "Plano atual" : "Ultimo plano";

  return (
    <Card>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{eyebrow}</p>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p>
            </div>
          </div>

          {subscription ? (
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSubscriptionStatusTone(subscription.status)}`}
            >
              {formatSubscriptionStatus(subscription.status)}
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-700 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{planLabel}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">
              {subscription ? formatSubscriptionPlan(subscription.plan) : isLoading ? "..." : "Plano indisponivel"}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-700 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Clientes</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">
              {subscription ? `${subscription.currentClients} / ${subscription.maxClients}` : isLoading ? "..." : "-"}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-700 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Expiracao</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">
              {subscription?.endsAt ? formatDate(subscription.endsAt) : isLoading ? "..." : "Sem data informada"}
            </p>
          </div>
        </div>

        {footerMessage ? (
          <div className="rounded-3xl border border-primary-100 bg-primary-50/80 p-5 dark:border-primary-500/30 dark:bg-primary-500/10">
            <p className="text-sm font-medium text-primary-900 dark:text-primary-100">{footerMessage}</p>
          </div>
        ) : null}

        {primaryAction || secondaryAction ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {primaryAction}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
