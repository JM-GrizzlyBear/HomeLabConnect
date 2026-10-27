import type { Payment, PaymentWithAppointment } from "../../domain/payments/payment.js";
import type {
  PaymentListQuery,
  PaymentRepository,
} from "../../domain/payments/PaymentRepository.js";
import { type AppointmentViewer, findViewable } from "../appointments/GetAppointment.js";
import type { PaymentGateway } from "../ports/PaymentGateway.js";
import type { PaymentRepositories } from "./paymentRepositories.js";

export type PaymentFilters = Omit<PaymentListQuery, "patientId">;

export interface ListPaymentsInput extends PaymentFilters {
  page: number;
  pageSize: number;
}

export interface ListPaymentsOutput {
  items: PaymentWithAppointment[];
  total: number;
  page: number;
  pageSize: number;
}

/** The most rows one export holds. */
export const EXPORT_LIMIT = 5000;

const everyone = (filters: PaymentFilters): PaymentListQuery => ({
  ...filters,
  q: filters.q?.trim() || null,
  patientId: null,
});

/** Staff: every payment, newest first, filtered and paged. */
export class ListPayments {
  constructor(private readonly payments: PaymentRepository) {}

  async execute({ page, pageSize, ...filters }: ListPaymentsInput): Promise<ListPaymentsOutput> {
    const result = await this.payments.list(everyone(filters), { page, pageSize });
    return { ...result, page, pageSize };
  }
}

/** Staff: the filtered payments as rows for a spreadsheet (at most EXPORT_LIMIT). */
export class ExportPayments {
  constructor(private readonly payments: PaymentRepository) {}

  async execute(filters: PaymentFilters): Promise<PaymentWithAppointment[]> {
    const { items } = await this.payments.list(everyone(filters), {
      page: 1,
      pageSize: EXPORT_LIMIT,
    });
    return items;
  }
}

/** A patient's own payments (settled ones: open or expired checkouts are left out). */
export class ListMyPayments {
  constructor(private readonly payments: PaymentRepository) {}

  async execute(patientId: string): Promise<PaymentWithAppointment[]> {
    const { items } = await this.payments.list(
      {
        status: null,
        provider: null,
        from: null,
        to: null,
        q: null,
        needsRefund: false,
        refundable: false,
        patientId,
      },
      null,
    );
    return items.filter((payment) => payment.paidAt !== null);
  }
}

export interface AppointmentPaymentsOutput {
  /** Whether patients can pay by card (Stripe is set up). */
  cardEnabled: boolean;
  /** Settled payments: open or expired checkouts are left out. */
  payments: Payment[];
}

/** An appointment's payments, for anyone who may see the appointment. */
export class ListAppointmentPayments {
  constructor(
    private readonly repositories: PaymentRepositories,
    private readonly gateway: PaymentGateway | null,
  ) {}

  async execute(
    appointmentId: string,
    viewer: AppointmentViewer,
  ): Promise<AppointmentPaymentsOutput> {
    await findViewable(this.repositories, appointmentId, viewer);
    const payments = await this.repositories.payments.listForAppointment(appointmentId);
    return {
      cardEnabled: this.gateway !== null,
      payments: payments.filter((payment) => payment.paidAt !== null),
    };
  }
}
