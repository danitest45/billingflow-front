import { getErrorMessage } from "../services/api";
import { useToast } from "./useToast";

type ApiFeedbackOptions<T> = {
  action: () => Promise<T>;
  successTitle?: string;
  successMessage?: string | ((result: T) => string | undefined);
  successActionLabel?: string;
  onSuccessAction?: () => void;
  errorTitle: string;
  errorFallbackMessage?: string;
  onSuccess?: (result: T) => void | Promise<void>;
  onError?: (message: string, error: unknown) => void | Promise<void>;
};

export function useApiFeedback() {
  const { showToast } = useToast();

  async function runWithFeedback<T>({
    action,
    successTitle,
    successMessage,
    successActionLabel,
    onSuccessAction,
    errorTitle,
    errorFallbackMessage,
    onSuccess,
    onError
  }: ApiFeedbackOptions<T>) {
    try {
      const result = await action();

      if (successTitle) {
        showToast({
          tone: "success",
          title: successTitle,
          message: typeof successMessage === "function" ? successMessage(result) : successMessage,
          actionLabel: successActionLabel,
          onAction: onSuccessAction
        });
      }

      await onSuccess?.(result);
      return result;
    } catch (error) {
      const message = getErrorMessage(
        error,
        errorFallbackMessage ?? "Nao foi possivel concluir a acao agora. Tente novamente."
      );

      showToast({
        tone: "error",
        title: errorTitle,
        message
      });

      await onError?.(message, error);
      throw error;
    }
  }

  return {
    runWithFeedback
  };
}
