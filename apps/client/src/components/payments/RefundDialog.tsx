import {
  centavosToPesos,
  formatPeso,
  type PaymentListItem,
  pesosToCentavos,
  refundRequestSchema,
} from "@homelabconnect/shared";
import type { SubmitEvent } from "react";
import { FormField } from "@/components/form/FormField";
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
import { refundPayment } from "../../api/payments";
import { useFeedback } from "../../feedback/feedbackContext";
import { providerLabels } from "../../format/payments";
import { useFormState } from "../../forms/useFormState";

interface RefundDialogProps {
  /** The payment to refund; null keeps the dialog closed. */
  payment: PaymentListItem | null;
  onClose(): void;
  onRefunded(updated: PaymentListItem): void;
}

/** Gives back part or all of what is left of a payment, with a reason the patient sees. */
export function RefundDialog({ payment, onClose, onRefunded }: RefundDialogProps) {
  return (
    <Dialog open={payment !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {payment && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refund {payment.appointment.code}</DialogTitle>
            <DialogDescription>
              {payment.provider === "stripe"
                ? "The money goes back to the patient's card through Stripe."
                : "Hand the cash back to the patient; this only records it."}
            </DialogDescription>
          </DialogHeader>
          <RefundForm payment={payment} onClose={onClose} onRefunded={onRefunded} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function RefundForm({
  payment,
  onClose,
  onRefunded,
}: RefundDialogProps & { payment: PaymentListItem }) {
  const feedback = useFeedback();
  const left = payment.amountCentavos - payment.refundedCentavos;
  const { values, errors, submitting, setValues, field, submit } = useFormState({
    amount: centavosToPesos(left),
    reason: "",
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountCentavos = pesosToCentavos(values.amount);
    const parsed = refundRequestSchema
      .refine(() => amountCentavos !== null, {
        path: ["amountCentavos"],
        message: "Enter an amount like 350 or 350.50.",
      })
      .refine((request) => request.amountCentavos <= left, {
        path: ["amountCentavos"],
        message: `At most ${formatPeso(left)} is left to refund.`,
      })
      .safeParse({ amountCentavos: amountCentavos ?? 0, reason: values.reason });
    await submit(
      parsed,
      async (request) => {
        onRefunded(await refundPayment(payment.id, request));
        feedback.success({ title: "Refund recorded" });
        onClose();
      },
      { title: "Couldn't refund the payment", fieldByCode: { invalid_refund: "amountCentavos" } },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <p className="text-sm text-muted-foreground">
        {payment.appointment.patient.name} paid {formatPeso(payment.amountCentavos)} (
        {providerLabels[payment.provider].toLowerCase()}). {formatPeso(left)} can still be refunded.
      </p>
      <TextInputField
        label="Amount (₱)"
        inputMode="decimal"
        {...field("amount", "amountCentavos")}
      />
      <FormField label="Reason" error={errors.reason}>
        {(control) => (
          <Textarea
            {...control}
            rows={3}
            value={values.reason}
            onChange={(event) => setValues({ reason: event.target.value })}
          />
        )}
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Back
        </Button>
        <Button type="submit" variant="destructive" loading={submitting}>
          Refund
        </Button>
      </DialogFooter>
    </form>
  );
}
