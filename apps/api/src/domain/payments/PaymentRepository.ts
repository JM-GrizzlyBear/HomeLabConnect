import type {
  Payment,
  PaymentProvider,
  PaymentRecordStatus,
  PaymentWithAppointment,
} from "./payment.js";

export interface PaymentListQuery {
  status: PaymentRecordStatus | null;
  provider: PaymentProvider | null;
  /** Created on or after / before these business dates. */
  from: string | null;
  to: string | null;
  /** Matches the appointment code or the patient's name. */
  q: string | null;
  /** Paid (or partly refunded) for a cancelled or rejected visit. */
  needsRefund: boolean;
  /** Paid with something left to refund. */
  refundable: boolean;
  patientId: string | null;
}

export interface PaymentListPage {
  items: PaymentWithAppointment[];
  total: number;
}

/**
 * Port: payments and their refunds. Each write also keeps the appointment's payment status
 * and history in step, in the same transaction.
 */
export interface PaymentRepository {
  findById(id: string): Promise<PaymentWithAppointment | null>;
  findByReference(reference: string): Promise<Payment | null>;
  listForAppointment(appointmentId: string): Promise<Payment[]>;
  list(
    query: PaymentListQuery,
    page: { page: number; pageSize: number } | null,
  ): Promise<PaymentListPage>;
  /** An open card checkout for the appointment. */
  createPending(input: {
    appointmentId: string;
    amountCentavos: number;
    reference: string;
    checkoutUrl: string;
  }): Promise<Payment>;
  /**
   * Marks a pending card payment paid, and its appointment paid. Returns false when it was
   * already settled (Stripe may send the same event more than once).
   */
  markPaid(paymentId: string, paidAt: Date): Promise<boolean>;
  markExpired(paymentId: string): Promise<void>;
  /**
   * Records cash for the whole total, unless the appointment was paid meanwhile (checked and
   * written atomically). Returns null in that case.
   */
  recordCash(input: {
    appointmentId: string;
    amountCentavos: number;
    actorId: string;
    paidAt: Date;
  }): Promise<Payment | null>;
  addRefund(input: {
    paymentId: string;
    amountCentavos: number;
    reason: string;
    actorId: string;
  }): Promise<void>;
  /** Remembers a webhook event; false if it was seen before. */
  recordWebhookEvent(eventId: string): Promise<boolean>;
}
