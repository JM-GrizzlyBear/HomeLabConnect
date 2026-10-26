import {
  type AppointmentPayments,
  appointmentPaymentsSchema,
  type AppointmentView,
  appointmentSchema,
  checkoutSchema,
  myPaymentsSchema,
  type PaymentList,
  type PaymentListItem,
  paymentListItemSchema,
  paymentListSchema,
  type PaymentProvider,
  type PaymentRecordStatus,
  type RefundRequest,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchAppointmentPayments(
  appointmentId: string,
  signal?: AbortSignal,
): Promise<AppointmentPayments> {
  return appointmentPaymentsSchema.parse(
    await apiRequest(`/appointments/${appointmentId}/payments`, { signal }),
  );
}

/** Opens a Stripe checkout for the visit; returns where to send the patient. */
export async function startCardPayment(appointmentId: string): Promise<string> {
  const { url } = checkoutSchema.parse(
    await apiRequest(`/appointments/${appointmentId}/checkout`, { method: "POST" }),
  );
  return url;
}

export async function recordCashPayment(appointmentId: string): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest(`/appointments/${appointmentId}/cash`, { method: "POST" }),
  );
}

export async function fetchMyPayments(signal?: AbortSignal): Promise<PaymentListItem[]> {
  return myPaymentsSchema.parse(await apiRequest("/payments/mine", { signal }));
}

export interface PaymentFilters {
  status?: PaymentRecordStatus;
  provider?: PaymentProvider;
  from?: string;
  to?: string;
  q?: string;
  needsRefund?: boolean;
  refundable?: boolean;
}

function toParams(filters: object): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== false) params.set(key, String(value));
  }
  return params;
}

export async function fetchPayments(
  filters: PaymentFilters & { page: number; pageSize: number },
  signal?: AbortSignal,
): Promise<PaymentList> {
  return paymentListSchema.parse(await apiRequest(`/payments?${toParams(filters)}`, { signal }));
}

/** Where the browser downloads the filtered payments as a CSV file. */
export function paymentsExportUrl(filters: PaymentFilters): string {
  const params = toParams(filters).toString();
  return `/api/payments/export${params ? `?${params}` : ""}`;
}

export async function refundPayment(
  paymentId: string,
  request: RefundRequest,
): Promise<PaymentListItem> {
  return paymentListItemSchema.parse(
    await apiRequest(`/payments/${paymentId}/refunds`, { method: "POST", body: request }),
  );
}
