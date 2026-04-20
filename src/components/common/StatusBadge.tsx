import { resolveInvoiceStatus } from "../../utils/format";

type StatusBadgeProps = {
  status?: unknown;
  paidAt?: string | null;
};

const statusMap = {
  paid: {
    label: "Pago",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
  },
  pending: {
    label: "Pendente",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
  },
  overdue: {
    label: "Atrasado",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"
  }
};

export function StatusBadge({ status, paidAt }: StatusBadgeProps) {
  const current = statusMap[resolveInvoiceStatus(status, paidAt)];

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${current.className}`}>
      {current.label}
    </span>
  );
}
