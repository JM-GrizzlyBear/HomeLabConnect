import { PaperclipIcon, XIcon } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useFeedback } from "../../feedback/feedbackContext";

const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 5 * 1024 * 1024;

/** Picks one photo or PDF (up to 5 MB) to send with a message; shows it, with a way to drop it. */
export function AttachButton({
  file,
  onChange,
}: {
  file: File | null;
  onChange(file: File | null): void;
}) {
  const feedback = useFeedback();
  const input = useRef<HTMLInputElement>(null);

  function pick(picked: File | undefined) {
    if (!picked) return;
    if (!ACCEPTED.split(",").includes(picked.type)) {
      feedback.error({ title: "Attach a JPG, PNG, WebP photo or a PDF" });
      return;
    }
    if (picked.size > MAX_BYTES) {
      feedback.error({ title: "Files must be 5 MB or smaller" });
      return;
    }
    onChange(picked);
  }

  return (
    <span className="flex min-w-0 items-center gap-1">
      <input
        ref={input}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        aria-label="Attach a file"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>
        <PaperclipIcon />
        <span className="max-w-40 truncate">{file ? file.name : "Photo or PDF"}</span>
      </Button>
      {file && (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Remove the file"
          onClick={() => onChange(null)}
        >
          <XIcon />
        </Button>
      )}
    </span>
  );
}
