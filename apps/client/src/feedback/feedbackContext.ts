import { createContext, type ReactNode, useContext } from "react";

export interface MessageOptions {
  title: string;
  description?: ReactNode;
  /** Extra content under the description, e.g. a temporary password to copy. */
  content?: ReactNode;
  /** Label of the button that closes the dialog. Defaults to "OK". */
  closeLabel?: string;
}

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button, for actions like deactivating an account. */
  destructive?: boolean;
}

/**
 * Dialogs for the result of an action. Field-level validation errors stay
 * inline under their field; everything else (success, a failed request, a
 * question before a risky action) goes through here.
 */
export interface Feedback {
  success(options: MessageOptions): void;
  error(options: MessageOptions): void;
  /** Resolves true when the user confirms, false when they cancel or dismiss. */
  confirm(options: ConfirmOptions): Promise<boolean>;
}

export const FeedbackContext = createContext<Feedback | null>(null);

export function useFeedback(): Feedback {
  const feedback = useContext(FeedbackContext);
  if (!feedback) throw new Error("useFeedback must be used inside <FeedbackProvider>.");
  return feedback;
}
