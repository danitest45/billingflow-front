import { useState } from "react";
import { useToast } from "./useToast";
import { getErrorMessage } from "../services/api";
import { billingService } from "../services/billing";

export function useCustomerPortal() {
  const { showToast } = useToast();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  async function openCustomerPortal() {
    setIsOpeningPortal(true);

    try {
      const response = await billingService.createCustomerPortalSession();

      if (!response.url) {
        throw new Error("Nao foi possivel abrir o gerenciamento da assinatura agora.");
      }

      window.location.assign(response.url);
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel abrir o gerenciamento da assinatura agora.");
      showToast({
        tone: "error",
        title: "Falha ao abrir gerenciamento",
        message
      });
    } finally {
      setIsOpeningPortal(false);
    }
  }

  return {
    isOpeningPortal,
    openCustomerPortal
  };
}
