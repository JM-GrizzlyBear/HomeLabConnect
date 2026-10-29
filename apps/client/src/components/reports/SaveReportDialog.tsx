import { saveReportRequestSchema } from "@homelabconnect/shared";
import type { SubmitEvent } from "react";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveReport } from "../../api/reports";
import { useFeedback } from "../../feedback/feedbackContext";
import { reportKindLabels, reportPresetLabels } from "../../format/reports";
import { useFormState } from "../../forms/useFormState";
import type { ReportSelection } from "./ReportControls";

interface SaveReportDialogProps {
  open: boolean;
  selection: ReportSelection;
  onClose(): void;
  onSaved(): void;
}

/** Names the current report so it opens again in one click. */
export function SaveReportDialog({ open, selection, onClose, onSaved }: SaveReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {open && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save this report</DialogTitle>
            <DialogDescription>
              {reportKindLabels[selection.kind]},{" "}
              {selection.preset === "custom"
                ? `${selection.from} to ${selection.to}`
                : `${reportPresetLabels[selection.preset]} (always the current one)`}
              . Only you see your saved reports.
            </DialogDescription>
          </DialogHeader>
          <SaveForm selection={selection} onClose={onClose} onSaved={onSaved} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function SaveForm({ selection, onClose, onSaved }: Omit<SaveReportDialogProps, "open">) {
  const feedback = useFeedback();
  const { values, submitting, field, submit } = useFormState({ name: "" });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const custom = selection.preset === "custom";
    await submit(
      saveReportRequestSchema.safeParse({
        name: values.name,
        kind: selection.kind,
        period: selection.period,
        preset: custom ? null : selection.preset,
        from: custom ? selection.from : null,
        to: custom ? selection.to : null,
      }),
      async (request) => {
        await saveReport(request);
        feedback.success({ title: "Report saved" });
        onSaved();
        onClose();
      },
      { title: "Couldn't save the report", fieldByCode: { saved_report_name_taken: "name" } },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <TextInputField
        label="Name"
        placeholder="e.g. Monthly revenue"
        autoFocus
        {...field("name")}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Back
        </Button>
        <Button type="submit" loading={submitting}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
