import { type ClosedDay, type ClosedDayKind, closedDayRequestSchema } from "@homelabconnect/shared";
import { type SubmitEvent, useId } from "react";
import { DatePickerField } from "@/components/form/DatePicker";
import { RadioGroupField } from "@/components/form/RadioGroupField";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createClosedDay, updateClosedDay } from "../../api/settings";
import { useAuth } from "../../auth/authContext";
import { useFeedback } from "../../feedback/feedbackContext";
import { closedDayKindLabels } from "../../format/settings";
import { useFormState } from "../../forms/useFormState";

/** "new" to add one, a closed day to edit it, or null when closed. */
export type ClosedDayDialogTarget = "new" | ClosedDay | null;

interface ClosedDayDialogProps {
  target: ClosedDayDialogTarget;
  onClose(): void;
  onSaved(): void;
}

const kindOptions = (Object.keys(closedDayKindLabels) as ClosedDayKind[]).map((kind) => ({
  value: kind,
  label: closedDayKindLabels[kind],
}));

/** Adds or edits a holiday or special day off. */
export function ClosedDayDialog({ target, onClose, onSaved }: ClosedDayDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {target === "new" ? "Add a closed day" : `Edit ${target.name}`}
            </DialogTitle>
            <DialogDescription>Patients can't book a visit on a closed day.</DialogDescription>
          </DialogHeader>
          <ClosedDayForm
            key={target === "new" ? "new" : target.id}
            closedDay={target === "new" ? null : target}
            onClose={onClose}
            onSaved={onSaved}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function ClosedDayForm({
  closedDay,
  onClose,
  onSaved,
}: {
  closedDay: ClosedDay | null;
  onClose(): void;
  onSaved(): void;
}) {
  const { token } = useAuth();
  const feedback = useFeedback();
  const repeatsId = useId();
  const { values, errors, submitting, set, setValues, field, submit } = useFormState({
    date: closedDay?.date ?? "",
    name: closedDay?.name ?? "",
    kind: closedDay?.kind ?? ("holiday" as ClosedDayKind),
    repeatsYearly: closedDay?.repeatsYearly ?? false,
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    await submit(
      closedDayRequestSchema.safeParse(values),
      async (request) => {
        const saved = closedDay
          ? await updateClosedDay(token, closedDay.id, request)
          : await createClosedDay(token, request);
        onClose();
        onSaved();
        feedback.success({
          title: closedDay ? "Closed day saved" : "Closed day added",
          description: `${saved.name} is closed for booking${saved.repeatsYearly ? " every year" : ""}.`,
        });
      },
      { title: "Couldn't save the closed day", fieldByCode: { closed_day_exists: "date" } },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <TextInputField
        label="Name"
        placeholder="e.g. Christmas Day or Company outing"
        autoComplete="off"
        {...field("name")}
      />
      <DatePickerField
        label="Date"
        value={values.date}
        onChange={set("date")}
        error={errors.date}
      />
      <div className="grid gap-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id={repeatsId}
            checked={values.repeatsYearly}
            onCheckedChange={(checked) => setValues({ repeatsYearly: checked === true })}
          />
          <Label htmlFor={repeatsId} className="font-normal">
            Repeats every year
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          For holidays on the same date each year, like Dec 25. Leave it off for one-time closures
          and holidays that move (Holy Week).
        </p>
      </div>
      <RadioGroupField
        label="Kind"
        inline
        options={kindOptions}
        value={values.kind}
        onValueChange={(kind) => setValues({ kind: kind as ClosedDayKind })}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {closedDay ? "Save" : "Add closed day"}
        </Button>
      </DialogFooter>
    </form>
  );
}
