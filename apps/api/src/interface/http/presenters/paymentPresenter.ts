import {
  centavosToPesos,
  type AppointmentPayments,
  type PaymentList,
  type PaymentListItem,
  type PaymentView,
} from "@homelabconnect/shared";
import type {
  AppointmentPaymentsOutput,
  ListPaymentsOutput,
} from "../../../application/payments/ListPayments.js";
import {
  paymentNeedsRefund,
  type Payment,
  type PaymentWithAppointment,
} from "../../../domain/payments/payment.js";
import type { HttpResponse } from "../httpTypes.js";

function toPaymentView(payment: Payment): PaymentView {
  return {
    id: payment.id,
    appointmentId: payment.appointmentId,
    provider: payment.provider,
    status: payment.status,
    amountCentavos: payment.amountCentavos,
    refundedCentavos: payment.refundedCentavos,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    refunds: payment.refunds.map((refund) => ({
      id: refund.id,
      amountCentavos: refund.amountCentavos,
      reason: refund.reason,
      createdAt: refund.createdAt.toISOString(),
    })),
  };
}

function toListItem(payment: PaymentWithAppointment): PaymentListItem {
  const { appointment } = payment;
  return {
    ...toPaymentView(payment),
    appointment: {
      code: appointment.code,
      date: appointment.date,
      status: appointment.status,
      patient: { id: appointment.patientId, name: appointment.patientName },
    },
    needsRefund: paymentNeedsRefund(payment),
  };
}

export function presentCheckout(url: string): HttpResponse<{ url: string }> {
  return { status: 200, body: { url } };
}

export function presentAppointmentPayments(
  output: AppointmentPaymentsOutput,
): HttpResponse<AppointmentPayments> {
  return {
    status: 200,
    body: { cardEnabled: output.cardEnabled, payments: output.payments.map(toPaymentView) },
  };
}

export function presentPayment(payment: PaymentWithAppointment): HttpResponse<PaymentListItem> {
  return { status: 200, body: toListItem(payment) };
}

export function presentPaymentList(output: ListPaymentsOutput): HttpResponse<PaymentList> {
  return { status: 200, body: { ...output, items: output.items.map(toListItem) } };
}

export function presentMyPayments(
  payments: PaymentWithAppointment[],
): HttpResponse<PaymentListItem[]> {
  return { status: 200, body: payments.map(toListItem) };
}

const providerNames = { stripe: "Card", cash: "Cash" } as const;
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

/** One cell: quoted when it holds a comma, quote or line break; formulas are defused. */
function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** The payments as a CSV file for a spreadsheet. */
export function presentPaymentsCsv(
  payments: PaymentWithAppointment[],
  today: string,
): HttpResponse<string> {
  const header = [
    "Paid at",
    "Appointment",
    "Visit date",
    "Patient",
    "Method",
    "Status",
    "Amount (PHP)",
    "Refunded (PHP)",
    "Visit status",
  ];
  const rows = payments.map((payment) => [
    payment.paidAt?.toISOString() ?? "",
    payment.appointment.code,
    payment.appointment.date,
    payment.appointment.patientName,
    providerNames[payment.provider],
    payment.status,
    centavosToPesos(payment.amountCentavos),
    centavosToPesos(payment.refundedCentavos),
    payment.appointment.status,
  ]);
  const body = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return {
    status: 200,
    // The byte-order mark makes Excel read it as UTF-8 (names with ñ)
    body: BYTE_ORDER_MARK + body + "\r\n",
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payments-${today}.csv"`,
    },
  };
}
