import type { PaymentProvider, PaymentRecordStatus, PaymentStatus } from "@homelabconnect/shared";

type Variant = "secondary" | "success" | "destructive" | "outline";

/** An appointment's payment. */
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  partially_refunded: "Partly refunded",
  refunded: "Refunded",
};

export const paymentStatusVariants: Record<PaymentStatus, Variant> = {
  unpaid: "secondary",
  paid: "success",
  partially_refunded: "outline",
  refunded: "outline",
};

/** One payment record (a checkout can also be open, failed or expired). */
export const paymentRecordStatusLabels: Record<PaymentRecordStatus, string> = {
  pending: "Checkout open",
  paid: "Paid",
  partially_refunded: "Partly refunded",
  refunded: "Refunded",
  failed: "Failed",
  expired: "Expired",
};

export const paymentRecordStatusVariants: Record<PaymentRecordStatus, Variant> = {
  pending: "secondary",
  paid: "success",
  partially_refunded: "outline",
  refunded: "outline",
  failed: "destructive",
  expired: "outline",
};

export const providerLabels: Record<PaymentProvider, string> = {
  stripe: "Card",
  cash: "Cash",
};

/** Statuses an appointment may be paid by card in. */
export const CARD_PAYABLE = ["confirmed", "reschedule_proposed", "on_the_way", "collected"];
/** Statuses the med team takes cash in. */
export const CASH_PAYABLE = ["on_the_way", "collected"];
