import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
  loading?: boolean;
  size?: "md" | "sm";
};

const variants = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-300 shadow-lg shadow-blue-600/20",
  secondary:
    "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-300 shadow-lg shadow-slate-900/10",
  ghost:
    "border border-slate-200 bg-white/80 text-slate-700 hover:bg-white focus-visible:outline-slate-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-300 shadow-lg shadow-rose-600/20"
};

export function Button({
  children,
  className = "",
  variant = "primary",
  fullWidth = false,
  loading = false,
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  const sizeClass = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm";
  const spinnerClass =
    variant === "ghost"
      ? "border-slate-300 border-t-slate-700"
      : "border-white/30 border-t-white";

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={`h-4 w-4 animate-spin rounded-full border-2 ${spinnerClass}`} />
      )}
      {children}
    </button>
  );
}
