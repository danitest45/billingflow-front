import { useState } from "react";
import { billingService } from "../services/billing";
import { useApiFeedback } from "./useApiFeedback";

export function useCustomerPortal() {
  const { runWithFeedback } = useApiFeedback();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  async function openCustomerPortal() {
    setIsOpeningPortal(true);

    try {
      const response = await runWithFeedback({
        action: async () => {
          const session = await billingService.createCustomerPortalSession();

          if (!session.url) {
            throw new Error("Nao foi possivel abrir o gerenciamento da assinatura agora.");
          }

          return session;
        },
        errorTitle: "Erro ao abrir gerenciamento",
        errorFallbackMessage: "Nao foi possivel abrir o gerenciamento da assinatura agora."
      });

      window.location.assign(response.url);
    } finally {
      setIsOpeningPortal(false);
    }
  }

  return {
    isOpeningPortal,
    openCustomerPortal
  };
}
