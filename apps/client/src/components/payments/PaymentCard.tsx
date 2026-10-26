import { type AppointmentView, formatPeso } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { BanknoteIcon, CreditCardIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "../../api/apiClient";
import { fetchAppointmentPayments, recordCashPayment, startCardPayment } from "../../api/payments";
import { useAuth } from "../../auth/authContext";
import { useCan } from "../../auth/useCan";
import { useFeedback } from "../../feedback/feedbackContext";
import {
  CARD_PAYABLE,
  CASH_PAYABLE,
  paymentStatusLabels,
  paymentStatusVariants,
  providerLabels,
} from "../../format/payments";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { ContentCard } from "../layout/ContentCard";

interface PaymentCardProps {
  appointment: AppointmentView;
  onChanged(updated: AppointmentView): void;
  className?: string;
}

/**
 * How the visit is paid: the status and each payment, plus Pay now (the patient, by card)
 * and Record cash (the med team, at the visit).
 */
export function PaymentCard({ appointment, onChanged, className }: PaymentCardProps) {
  const { user } = useAuth();
  const can = useCan();
  const feedback = useFeedback();
  const [busy, setBusy] = useState(false);
  const { data, reload } = useApiQuery(
    queryKeys.appointmentPayments(appointment.id),
    async (signal) => await fetchAppointmentPayments(appointment.id, signal),
    { errorMessage: "Could not load the payments." },
  );
  const unpaid = appointment.paymentStatus === "unpaid" && appointment.totalCentavos > 0;
  const isOwner = user?.id === appointment.patient.id;
  const canPayByCard =
    isOwner &&
    unpaid &&
    data?.cardEnabled === true &&
    can("payments.pay") &&
    CARD_PAYABLE.includes(appointment.status);
  const canTakeCash =
    !isOwner && unpaid && can("payments.record_cash") && CASH_PAYABLE.includes(appointment.status);

  function failed(title: string, error: unknown) {
    feedback.error({
      title,
      description:
        error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
    });
  }

  async function payByCard() {
    setBusy(true);
    try {
      window.location.assign(await startCardPayment(appointment.id));
    } catch (error) {
      failed("Couldn't open the payment page", error);
      setBusy(false);
    }
  }

  async function takeCash() {
    const confirmed = await feedback.confirm({
      title: `Record ${formatPeso(appointment.totalCentavos)} cash?`,
      description: `Only once you have the full amount from ${appointment.patient.name}.`,
      confirmLabel: "Record cash",
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      onChanged(await recordCashPayment(appointment.id));
      reload();
      feedback.success({ title: "Cash payment recorded" });
    } catch (error) {
      failed("Couldn't record the payment", error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ContentCard title="Payment" className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-2xl font-bold">{formatPeso(appointment.totalCentavos)}</span>
        <Badge variant={paymentStatusVariants[appointment.paymentStatus]}>
          {appointment.totalCentavos === 0
            ? "No charge"
            : paymentStatusLabels[appointment.paymentStatus]}
        </Badge>
      </div>
      {appointment.needsRefund && (
        <p className="mt-2 text-sm text-destructive">
          {isOwner
            ? "This visit was cancelled. We'll refund your payment."
            : "Paid, but the visit was cancelled: needs a refund."}
        </p>
      )}
      {data && data.payments.length > 0 && (
        <ul className="mt-4 grid gap-2 text-sm">
          {data.payments.map((payment) => (
            <li key={payment.id} className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex justify-between gap-2">
                <span className="font-medium">
                  {providerLabels[payment.provider]} · {formatPeso(payment.amountCentavos)}
                </span>
                {payment.paidAt && (
                  <span className="text-muted-foreground">
                    {format(parseISO(payment.paidAt), "MMM d, h:mm a")}
                  </span>
                )}
              </div>
              {payment.refunds.map((refund) => (
                <p key={refund.id} className="text-muted-foreground">
                  Refunded {formatPeso(refund.amountCentavos)} — {refund.reason}
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}
      {unpaid && isOwner && data && !data.cardEnabled && (
        <p className="mt-3 text-sm text-muted-foreground">
          Pay in cash to the med team at your visit.
        </p>
      )}
      {unpaid && isOwner && data?.cardEnabled && !CARD_PAYABLE.includes(appointment.status) && (
        <p className="mt-3 text-sm text-muted-foreground">
          You can pay once your visit is confirmed.
        </p>
      )}
      {(canPayByCard || canTakeCash) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canPayByCard && (
            <Button loading={busy} onClick={() => void payByCard()}>
              <CreditCardIcon />
              Pay now
            </Button>
          )}
          {canTakeCash && (
            <Button variant="outline" loading={busy} onClick={() => void takeCash()}>
              <BanknoteIcon />
              Record cash payment
            </Button>
          )}
        </div>
      )}
    </ContentCard>
  );
}
