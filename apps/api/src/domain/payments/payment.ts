import type { AppointmentStatus, PaymentStatus } from "../appointments/appointment.js";
import { InvalidRefund } from "./paymentErrors.js";

export type PaymentProvider = "stripe" | "cash";

export type PaymentRecordStatus =
  "pending" | "paid" | "partially_refunded" | "refunded" | "failed" | "expired";

export interface PaymentRefund {
  id: string;
  amountCentavos: number;
  reason: string;
  refundedBy: string | null;
  createdAt: Date;
}

/** Money taken for an appointment: a card checkout (Stripe) or cash at the visit. */
export interface Payment {
  id: string;
  appointmentId: string;
  provider: PaymentProvider;
  status: PaymentRecordStatus;
  amountCentavos: number;
  refundedCentavos: number;
  /** Stripe's checkout session id; null for cash. */
  providerReference: string | null;
  /** Where the patient pays, while a card checkout is open. */
  checkoutUrl: string | null;
  /** Who recorded a cash payment. */
  recordedBy: string | null;
  paidAt: Date | null;
  createdAt: Date;
  /** Taken after the visit was already paid: this one should be refunded. */
  duplicate: boolean;
  refunds: PaymentRefund[];
}

/** A payment with the appointment it belongs to, for the payment lists. */
export interface PaymentWithAppointment extends Payment {
  appointment: {
    code: string;
    date: string;
    status: AppointmentStatus;
    patientId: string;
    patientName: string;
  };
}

/** Statuses an appointment may be paid from: once confirmed, up to the collected samples. */
export const PAYABLE_STATUSES: readonly AppointmentStatus[] = [
  "confirmed",
  "reschedule_proposed",
  "on_the_way",
  "collected",
];

/** The med team takes cash at the visit. */
export const CASH_STATUSES: readonly AppointmentStatus[] = ["on_the_way", "collected"];

/** How long a card checkout stays open (Stripe allows 30 minutes to 24 hours). */
export const CHECKOUT_MINUTES = 60;

/** What is left to refund. */
export function refundable(
  payment: Pick<Payment, "status" | "amountCentavos" | "refundedCentavos">,
) {
  if (payment.status !== "paid" && payment.status !== "partially_refunded") return 0;
  return payment.amountCentavos - payment.refundedCentavos;
}

/** Business rule: a refund is more than nothing and at most what is left. */
export function assertRefund(payment: Payment, amountCentavos: number): void {
  const left = refundable(payment);
  if (left === 0) throw new InvalidRefund("This payment has nothing left to refund.");
  if (!Number.isInteger(amountCentavos) || amountCentavos <= 0) {
    throw new InvalidRefund("Enter an amount above ₱0.");
  }
  if (amountCentavos > left) throw new InvalidRefund("That's more than what is left to refund.");
}

/** The payment's status once `amountCentavos` more is refunded. */
export function statusAfterRefund(
  payment: Pick<Payment, "amountCentavos" | "refundedCentavos">,
  amountCentavos: number,
): "partially_refunded" | "refunded" {
  return payment.refundedCentavos + amountCentavos >= payment.amountCentavos
    ? "refunded"
    : "partially_refunded";
}

/**
 * Business rule: a payment with money left, for a visit that was cancelled or rejected, or
 * that an earlier payment already covered (paid twice).
 */
export function paymentNeedsRefund(payment: PaymentWithAppointment): boolean {
  return (
    refundable(payment) > 0 &&
    (payment.duplicate ||
      payment.appointment.status === "cancelled" ||
      payment.appointment.status === "rejected")
  );
}

/**
 * Business rule: a visit that was paid but then cancelled or rejected waits for an admin to
 * refund it (refunds are never automatic).
 */
export function needsRefund(appointment: {
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
}): boolean {
  return (
    (appointment.status === "cancelled" || appointment.status === "rejected") &&
    (appointment.paymentStatus === "paid" || appointment.paymentStatus === "partially_refunded")
  );
}
