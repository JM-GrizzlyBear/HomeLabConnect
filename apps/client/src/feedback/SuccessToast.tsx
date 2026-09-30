import { CircleCheckIcon, XIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export interface ToastMessage {
  id: number;
  title: string;
  description?: ReactNode;
}

interface SuccessToastsProps {
  toasts: readonly ToastMessage[];
  /** How long each toast stays, in ms. Hovering pauses it. */
  durationMs: number;
  onDismiss(id: number): void;
}

/** Small success notices stacked in the top-right corner. They go away on their own. */
export function SuccessToasts({ toasts, durationMs, onDismiss }: SuccessToastsProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-100 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <SuccessToast key={toast.id} toast={toast} durationMs={durationMs} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function SuccessToast({
  toast,
  durationMs,
  onDismiss,
}: {
  toast: ToastMessage;
  durationMs: number;
  /** Must be stable (useCallback), or every re-render restarts the timer. */
  onDismiss(id: number): void;
}) {
  // Paused while the pointer is over it, so a longer message can still be read.
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) return;
    const timer = setTimeout(() => onDismiss(toast.id), durationMs);
    return () => clearTimeout(timer);
  }, [hovered, durationMs, onDismiss, toast.id]);

  return (
    <div
      className="pointer-events-auto flex animate-in items-start gap-3 rounded-lg border bg-background p-3 shadow-lg duration-200 fade-in-0 slide-in-from-top-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CircleCheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
      >
        <XIcon />
      </Button>
    </div>
  );
}
