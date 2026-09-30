import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** A one-time value (e.g. a temporary password) shown in monospace with a Copy button. */
export function CopyableSecret({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard blocked: the value is still selectable by hand.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2 ring-1 ring-amber-200">
      <code
        aria-label={label}
        className="flex-1 px-2 font-mono text-base tracking-wider text-amber-950 select-all"
      >
        {value}
      </code>
      <Button variant="outline" size="sm" onClick={() => void copy()}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
