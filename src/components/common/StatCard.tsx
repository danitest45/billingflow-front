import { Card } from "./Card";

type StatCardProps = {
  title: string;
  value: string;
  hint: string;
  accent: "blue" | "emerald" | "amber" | "rose";
};

const accentClasses = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-100 dark:ring-blue-500/30",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-500/30",
  amber: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30",
  rose: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/30"
};

export function StatCard({ title, value, hint, accent }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute right-0 top-0 h-24 w-24 -translate-y-10 translate-x-8 rounded-full blur-3xl ${accent === "blue" ? "bg-blue-300/30" : ""} ${accent === "emerald" ? "bg-emerald-300/30" : ""} ${accent === "amber" ? "bg-amber-300/30" : ""} ${accent === "rose" ? "bg-rose-300/30" : ""}`}
      />
      <div className="relative space-y-4">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${accentClasses[accent]}`}>
          {title}
        </span>
        <div>
          <p className="text-3xl font-extrabold text-slate-950 dark:text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{hint}</p>
        </div>
      </div>
    </Card>
  );
}
