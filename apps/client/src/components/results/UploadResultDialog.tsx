import type { AppointmentResults } from "@homelabconnect/shared";
import { PaperclipIcon } from "lucide-react";
import { type SubmitEvent, useRef, useState } from "react";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { uploadTestResult } from "../../api/results";
import { useFeedback } from "../../feedback/feedbackContext";
import { handleSubmitError } from "../../forms/submitErrors";

const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 5 * 1024 * 1024;

type Test = AppointmentResults["tests"][number];

interface UploadResultDialogProps {
  appointmentId: string;
  /** The test to add a result to; null keeps the dialog closed. */
  test: Test | null;
  onClose(): void;
  onUploaded(): void;
}

/** A doctor adds (or replaces) one test's result: a PDF or photo and an optional comment. */
export function UploadResultDialog({
  appointmentId,
  test,
  onClose,
  onUploaded,
}: UploadResultDialogProps) {
  return (
    <Dialog open={test !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {test && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {test.result ? "Replace" : "Upload"} the {test.code} result
            </DialogTitle>
            <DialogDescription>
              A PDF or photo up to 5 MB. It stays a draft until you release the results.
            </DialogDescription>
          </DialogHeader>
          <UploadForm
            appointmentId={appointmentId}
            test={test}
            onClose={onClose}
            onUploaded={onUploaded}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function UploadForm({
  appointmentId,
  test,
  onClose,
  onUploaded,
}: Omit<UploadResultDialogProps, "test"> & { test: Test }) {
  const feedback = useFeedback();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState(test.result?.comment ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function pick(picked: File | undefined) {
    if (!picked) return;
    setFile(picked);
    setErrors(picked.size > MAX_BYTES ? { file: "Files must be 5 MB or smaller." } : {});
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setErrors({ file: "Choose the result file." });
    if (file.size > MAX_BYTES) return setErrors({ file: "Files must be 5 MB or smaller." });
    setSaving(true);
    try {
      await uploadTestResult(appointmentId, test.procedureId, { file, comment });
      onUploaded();
      feedback.success({ title: "Result uploaded" });
      onClose();
    } catch (error) {
      handleSubmitError(error, {
        title: "Couldn't upload the result",
        fieldByCode: { invalid_result: "file" },
        feedback,
        setFieldErrors: setErrors,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <FormField label="Result file" error={errors.file}>
        {(control) => (
          <div>
            <input
              ref={input}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              aria-label="Choose the result file"
              onChange={(event) => {
                pick(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              {...control}
              type="button"
              variant="outline"
              onClick={() => input.current?.click()}
            >
              <PaperclipIcon />
              {file ? file.name : "Choose a PDF or photo"}
            </Button>
          </div>
        )}
      </FormField>
      <FormField label="Comment" error={errors.comment} optional>
        {(control) => (
          <Textarea
            {...control}
            rows={3}
            placeholder="e.g. All values within normal range."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        )}
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Back
        </Button>
        <Button type="submit" loading={saving}>
          Upload
        </Button>
      </DialogFooter>
    </form>
  );
}
