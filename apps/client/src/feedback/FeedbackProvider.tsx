import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  type ConfirmOptions,
  type Feedback,
  FeedbackContext,
  type MessageOptions,
} from "./feedbackContext";
import { SuccessToasts, type ToastMessage } from "./SuccessToast";

type Message = MessageOptions & { tone: "success" | "error" };
type Question = ConfirmOptions & { resolve(confirmed: boolean): void };

/** How long a success toast stays before it goes away on its own. */
const TOAST_DURATION_MS = 5_000;

interface FeedbackProviderProps {
  children: ReactNode;
  /** Tests pass a longer time so a toast doesn't vanish before it's checked. */
  toastDurationMs?: number;
}

/**
 * Renders what useFeedback() asks for: success toasts in the top-right corner,
 * one message dialog (errors, and successes the user must act on) and one
 * confirm dialog.
 */
export function FeedbackProvider({
  children,
  toastDurationMs = TOAST_DURATION_MS,
}: FeedbackProviderProps) {
  const [message, setMessage] = useState<Message | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  // Resolves a confirm() still waiting when a newer one replaces it.
  const pending = useRef<Question | null>(null);
  const nextToastId = useRef(0);

  const feedback = useMemo<Feedback>(
    () => ({
      success: (options) => {
        // Something to act on (e.g. a password to copy) needs a dialog that waits for the user.
        if (options.content) {
          setMessage({ ...options, tone: "success" });
          setMessageOpen(true);
          return;
        }
        const id = nextToastId.current++;
        setToasts((current) => [
          ...current,
          { id, title: options.title, description: options.description },
        ]);
      },
      error: (options) => {
        setMessage({ ...options, tone: "error" });
        setMessageOpen(true);
      },
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          pending.current?.resolve(false);
          const next = { ...options, resolve };
          pending.current = next;
          setQuestion(next);
          setQuestionOpen(true);
        }),
    }),
    [],
  );

  const answer = useCallback((confirmed: boolean) => {
    pending.current?.resolve(confirmed);
    pending.current = null;
    setQuestionOpen(false);
  }, []);

  const dismissToast = useCallback(
    (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  );

  return (
    <FeedbackContext.Provider value={feedback}>
      {children}

      <SuccessToasts toasts={toasts} durationMs={toastDurationMs} onDismiss={dismissToast} />

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        {message && (
          <DialogContent showCloseButton={false} className="sm:max-w-md">
            <DialogHeader className="items-center text-center sm:items-start sm:text-left">
              <span
                className={cn(
                  "mb-1 flex size-11 items-center justify-center rounded-full",
                  message.tone === "success"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-destructive",
                )}
              >
                {message.tone === "success" ? (
                  <CircleCheckIcon className="size-6" aria-hidden />
                ) : (
                  <CircleAlertIcon className="size-6" aria-hidden />
                )}
              </span>
              <DialogTitle className="text-base">{message.title}</DialogTitle>
              {message.description ? (
                <DialogDescription>{message.description}</DialogDescription>
              ) : (
                <DialogDescription className="sr-only">{message.title}</DialogDescription>
              )}
            </DialogHeader>
            {message.content}
            <DialogFooter>
              <Button onClick={() => setMessageOpen(false)} autoFocus>
                {message.closeLabel ?? "OK"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={questionOpen} onOpenChange={(open) => !open && answer(false)}>
        {question && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{question.title}</AlertDialogTitle>
              {question.description && (
                <AlertDialogDescription>{question.description}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => answer(false)}>
                {question.cancelLabel ?? "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                variant={question.destructive ? "destructive" : "default"}
                onClick={() => answer(true)}
              >
                {question.confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </FeedbackContext.Provider>
  );
}
