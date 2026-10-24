import { type LeaveType, leaveRequestBodySchema } from "@homelabconnect/shared";
import type { SubmitEvent } from "react";
import { DatePickerField } from "@/components/form/DatePicker";
import { FormField } from "@/components/form/FormField";
import { RadioGroupField } from "@/components/form/RadioGroupField";
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
import { requestLeave } from "../../api/scheduling";
import { useFeedback } from "../../feedback/feedbackContext";
import { approvalStepLabels, leaveTypeLabels } from "../../format/leave";
import { useFormState } from "../../forms/useFormState";

interface LeaveRequestDialogProps {
  open: boolean;
  onClose(): void;
  onFiled(): void;
}

const typeOptions = (Object.keys(leaveTypeLabels) as LeaveType[]).map((type) => ({
  value: type,
  label: leaveTypeLabels[type],
}));

/** Files a leave request. It goes to the team lead and/or an admin. */
export function LeaveRequestDialog({ open, onClose, onFiled }: LeaveRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {open && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
            <DialogDescription>
              Med team leave goes to your team lead first, then an admin. Everyone else's goes to an
              admin.
            </DialogDescription>
          </DialogHeader>
          <LeaveForm onClose={onClose} onFiled={onFiled} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function LeaveForm({ onClose, onFiled }: Omit<LeaveRequestDialogProps, "open">) {
  const feedback = useFeedback();
  const { values, errors, submitting, set, setValues, submit } = useFormState({
    type: "vacation" as LeaveType,
    startsOn: "",
    endsOn: "",
    reason: "",
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(
      leaveRequestBodySchema.safeParse(values),
      async (request) => {
        const filed = await requestLeave(request);
        onClose();
        onFiled();
        feedback.success({
          title: "Leave requested",
          description: `It's waiting for ${filed.waitingFor ? approvalStepLabels[filed.waitingFor].toLowerCase() : "approval"}.`,
        });
      },
      {
        title: "Couldn't request leave",
        fieldByCode: { leave_overlap: "startsOn", invalid_leave: "startsOn" },
      },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <RadioGroupField
        label="Type"
        inline
        options={typeOptions}
        value={values.type}
        onValueChange={(type) => setValues({ type: type as LeaveType })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <DatePickerField
          label="First day"
          value={values.startsOn}
          onChange={(startsOn) =>
            // A one-day request is the usual case, so the last day follows the first.
            setValues({
              startsOn,
              endsOn: values.endsOn && values.endsOn >= startsOn ? values.endsOn : startsOn,
            })
          }
          error={errors.startsOn}
        />
        <DatePickerField
          label="Last day"
          value={values.endsOn}
          onChange={set("endsOn")}
          min={values.startsOn || undefined}
          error={errors.endsOn}
        />
      </div>
      <FormField label="Reason" error={errors.reason}>
        {(control) => (
          <Textarea
            {...control}
            name="reason"
            placeholder="e.g. Family trip, flu"
            value={values.reason}
            onChange={(e) => set("reason")(e.target.value)}
          />
        )}
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Send request
        </Button>
      </DialogFooter>
    </form>
  );
}
