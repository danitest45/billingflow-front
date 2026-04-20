import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        id={id}
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/20 ${error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/60 dark:focus:border-rose-500 dark:focus:ring-rose-500/20" : ""} ${className}`}
        {...props}
      />
      {error ? <span className="text-sm text-rose-600 dark:text-rose-300">{error}</span> : null}
    </label>
  );
}
