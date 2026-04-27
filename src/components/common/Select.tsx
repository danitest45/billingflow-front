import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({ label, error, className = "", id, children, ...props }: SelectProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <select
        id={id}
        className={`min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/20 ${error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/60 dark:focus:border-rose-500 dark:focus:ring-rose-500/20" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-sm text-rose-600 dark:text-rose-300">{error}</span> : null}
    </label>
  );
}
