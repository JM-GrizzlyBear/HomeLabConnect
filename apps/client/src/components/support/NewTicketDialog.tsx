import { openTicketFieldsSchema } from "@homelabconnect/shared";
import { type SubmitEvent, useState } from "react";
import { useNavigate } from "react-router";
import { FormField } from "@/components/form/FormField";
import { SelectInputField } from "@/components/form/SelectInputField";
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
import { Textarea } from "@/components/ui/textarea";
import { fetchMyAppointments } from "../../api/appointments";
import { openTicket } from "../../api/support";
import { useFeedback } from "../../feedback/feedbackContext";
import { formatVisit } from "../../format/appointments";
import { ticketCategoryLabels } from "../../format/support";
import { useFormState } from "../../forms/useFormState";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { AttachButton } from "./AttachButton";

const NO_VISIT = "none";
const categoryOptions = Object.entries(ticketCategoryLabels).map(([value, label]) => ({
  value,
  label,
}));

/** A patient asks for help: what it's about, the visit (if any) and the first message. */
export function NewTicketDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {open && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New ticket</DialogTitle>
            <DialogDescription>
              Tell us what you need. A support agent replies here, usually within the day.
            </DialogDescription>
          </DialogHeader>
          <NewTicketForm onClose={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function NewTicketForm({ onClose }: { onClose(): void }) {
  const feedback = useFeedback();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const { values, errors, submitting, field, setValues, submit } = useFormState({
    subject: "",
    category: "",
    appointmentId: NO_VISIT,
    message: "",
  });
  const { data: appointments } = useApiQuery(queryKeys.myAppointments, fetchMyAppointments, {
    errorMessage: "Could not load your visits.",
  });
  const visitOptions = [
    { value: NO_VISIT, label: "Not about a visit" },
    ...(appointments ?? []).map((appointment) => ({
      value: appointment.id,
      label: `${appointment.code} · ${formatVisit(appointment.date, appointment.slot)}`,
    })),
  ];

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const appointmentId = values.appointmentId === NO_VISIT ? "" : values.appointmentId;
    await submit(
      openTicketFieldsSchema.safeParse({ ...values, appointmentId }),
      async (fields) => {
        const ticket = await openTicket({
          subject: fields.subject,
          category: fields.category,
          appointmentId: fields.appointmentId || null,
          message: fields.message,
          file,
        });
        feedback.success({ title: "Ticket sent", description: ticket.code });
        onClose();
        void navigate(`/app/support/tickets/${ticket.id}`);
      },
      {
        title: "Couldn't send your ticket",
        fieldByCode: { appointment_not_found: "appointmentId" },
      },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <TextInputField
        label="Subject"
        placeholder="e.g. When will my results be ready?"
        autoFocus
        {...field("subject")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInputField
          label="Category"
          options={categoryOptions}
          value={values.category}
          onValueChange={(category) => setValues({ category })}
          error={errors.category}
        />
        <SelectInputField
          label="Visit"
          options={visitOptions}
          value={values.appointmentId}
          onValueChange={(appointmentId) => setValues({ appointmentId })}
          error={errors.appointmentId}
          required={false}
        />
      </div>
      <FormField label="Message" error={errors.message}>
        {(control) => (
          <Textarea
            {...control}
            rows={4}
            placeholder="Tell us what happened and how we can help."
            value={values.message}
            onChange={(event) => setValues({ message: event.target.value })}
          />
        )}
      </FormField>
      <DialogFooter className="items-center sm:justify-between">
        <AttachButton file={file} onChange={setFile} />
        <span className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button type="submit" loading={submitting}>
            Send
          </Button>
        </span>
      </DialogFooter>
    </form>
  );
}
