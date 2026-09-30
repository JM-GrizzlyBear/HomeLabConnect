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

type Message = MessageOptions & { tone: "success" | "error" };
type Question = ConfirmOptions & { resolve(confirmed: boolean): void };

/** Renders the app's one message dialog and one confirm dialog, driven by useFeedback(). */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<Message | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionOpen, setQuestionOpen] = useState(false);
  // Resolves a confirm() still waiting when a newer one replaces it.
  const pending = useRef<Question | null>(null);

  const feedback = useMemo<Feedback>(
    () => ({
      success: (options) => {
        setMessage({ ...options, tone: "success" });
        setMessageOpen(true);
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

  return (
    <FeedbackContext.Provider value={feedback}>
      {children}

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
