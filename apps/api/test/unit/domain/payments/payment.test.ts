import { describe, expect, it } from "vitest";
import {
  assertRefund,
  needsRefund,
  type Payment,
  paymentNeedsRefund,
  type PaymentWithAppointment,
  refundable,
  statusAfterRefund,
} from "../../../../src/domain/payments/payment.js";
import { InvalidRefund } from "../../../../src/domain/payments/paymentErrors.js";

const payment = (overrides: Partial<Payment> = {}): Payment => ({
  id: "p1",
  appointmentId: "a1",
  provider: "cash",
  status: "paid",
  amountCentavos: 70_000,
  refundedCentavos: 0,
  providerReference: null,
  checkoutUrl: null,
  recordedBy: null,
  paidAt: new Date("2026-01-15T08:00:00Z"),
  createdAt: new Date("2026-01-15T08:00:00Z"),
  refunds: [],
  ...overrides,
});

describe("refunds", () => {
  it("can give back what is left of a settled payment", () => {
    expect(refundable(payment())).toBe(70_000);
    expect(refundable(payment({ status: "partially_refunded", refundedCentavos: 10_000 }))).toBe(
      60_000,
    );
    expect(refundable(payment({ status: "pending" }))).toBe(0);
    expect(refundable(payment({ status: "refunded", refundedCentavos: 70_000 }))).toBe(0);
  });

  it("refuses nothing, fractions, and more than is left", () => {
    expect(() => assertRefund(payment(), 0)).toThrow(InvalidRefund);
    expect(() => assertRefund(payment(), 10.5)).toThrow(InvalidRefund);
    expect(() => assertRefund(payment(), 70_001)).toThrow("more than what is left");
    expect(() => assertRefund(payment({ status: "expired" }), 100)).toThrow("nothing left");
    expect(() => assertRefund(payment(), 70_000)).not.toThrow();
  });

  it("is partial until everything is back", () => {
    expect(statusAfterRefund(payment(), 10_000)).toBe("partially_refunded");
    expect(statusAfterRefund(payment({ refundedCentavos: 10_000 }), 60_000)).toBe("refunded");
  });

  it("is needed when a paid visit is cancelled or rejected", () => {
    expect(needsRefund({ status: "cancelled", paymentStatus: "paid" })).toBe(true);
    expect(needsRefund({ status: "rejected", paymentStatus: "partially_refunded" })).toBe(true);
    expect(needsRefund({ status: "cancelled", paymentStatus: "unpaid" })).toBe(false);
    expect(needsRefund({ status: "cancelled", paymentStatus: "refunded" })).toBe(false);
    expect(needsRefund({ status: "collected", paymentStatus: "paid" })).toBe(false);
  });

  it("is needed for a payment taken twice, until it is refunded", () => {
    const listed = (overrides: Partial<PaymentWithAppointment>): PaymentWithAppointment => ({
      ...payment(),
      duplicate: false,
      appointment: {
        code: "HLC-000001",
        date: "2026-01-17",
        status: "collected",
        patientId: "u1",
        patientName: "Juan Dela Cruz",
      },
      ...overrides,
    });
    expect(paymentNeedsRefund(listed({}))).toBe(false);
    expect(paymentNeedsRefund(listed({ duplicate: true }))).toBe(true);
    expect(
      paymentNeedsRefund(listed({ duplicate: true, status: "refunded", refundedCentavos: 70_000 })),
    ).toBe(false);
  });
});
