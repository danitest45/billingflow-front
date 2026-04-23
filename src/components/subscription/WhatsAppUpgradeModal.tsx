import { Button } from "../common/Button";
import { Modal } from "../common/Modal";

type WhatsAppUpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
};

export const whatsAppPremiumBenefits = [
  "Envie cobrancas pelo WhatsApp com um clique",
  "Use mensagens personalizadas com nome, valor e vencimento",
  "Edite o texto da cobranca do seu jeito",
  "Ganhe mais praticidade na rotina"
];

export function WhatsAppUpgradeModal({ open, onClose, onUpgrade }: WhatsAppUpgradeModalProps) {
  return (
    <Modal
      open={open}
      title="Cobranca via WhatsApp: recurso premium"
      description="Automatize sua cobranca com mensagens prontas e ganhe mais agilidade no contato com seus clientes."
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/80 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">
                Disponivel a partir do Starter
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                Cobre mais rapido sem sair da sua rotina
              </h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:bg-slate-950/70 dark:text-emerald-200">
              Premium
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {whatsAppPremiumBenefits.map((benefit) => (
              <div key={benefit} className="flex gap-3 rounded-2xl bg-white/75 p-3 dark:bg-slate-950/50">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Agora nao
          </Button>
          <Button type="button" onClick={onUpgrade}>
            Fazer upgrade
          </Button>
        </div>
      </div>
    </Modal>
  );
}
