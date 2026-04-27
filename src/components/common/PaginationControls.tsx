import { Button } from "./Button";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  onPageChange
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700/80">
      <p className="text-sm text-slate-500 dark:text-slate-300">
        {totalCount} registro{totalCount === 1 ? "" : "s"} encontrados
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button
          size="sm"
          variant="ghost"
          className="w-full sm:w-auto"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <div className="order-first rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 sm:order-none dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
          Pagina {Math.max(page, 1)} de {Math.max(totalPages, 1)}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="w-full sm:w-auto"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Proxima
        </Button>
      </div>
    </div>
  );
}
