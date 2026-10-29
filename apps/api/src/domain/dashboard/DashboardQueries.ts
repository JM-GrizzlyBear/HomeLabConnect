import type { AppointmentStatus } from "../appointments/appointment.js";

/** A count (or centavos) per business date "YYYY-MM-DD", or per month "YYYY-MM". */
export type Series = Map<string, number>;

export interface DateRange {
  /** Business dates, inclusive, Philippine time. */
  from: string;
  to: string;
}

export interface PaymentTotals {
  card: number;
  cash: number;
  refunded: number;
}

export interface Turnaround {
  released: number;
  /** Average hours from the visit being collected to its results being released. */
  averageHours: number | null;
  releasedWithin24h: number;
}

export interface PatientSummary {
  upcoming: number;
  resultsReady: number;
  resultsLocked: number;
  resultsPending: number;
  balanceDueCentavos: number;
  /** Paid (less refunds), per month. */
  spendingPerMonth: Series;
  /** Collected visits per month. */
  visitsPerMonth: Series;
  visitsThisYear: number;
  paidVisitsThisYear: number;
  testsTaken: { label: string; value: number }[];
}

/**
 * Port: the read-only numbers behind the dashboards. `teamIds` narrows to those teams' visits
 * (the med team's own); null means every visit.
 */
export interface DashboardQueries {
  /** Bookings made per day (when they were booked). */
  bookingsPerDay(range: DateRange): Promise<Series>;
  /** Visits on a date, by status (cancelled and rejected ones included). */
  visitsByStatus(
    date: string,
    teamIds: readonly string[] | null,
  ): Promise<Map<AppointmentStatus, number>>;
  /** Visits per day (by visit date) that hold a place: not cancelled or rejected. */
  visitsPerDay(range: DateRange, teamIds: readonly string[] | null): Promise<Series>;
  /** Money kept per day (paid less refunds), by the day it was paid. */
  revenuePerDay(range: DateRange): Promise<Series>;
  /** Money taken in the range by method, and how much was refunded. */
  paymentTotals(range: DateRange, teamIds: readonly string[] | null): Promise<PaymentTotals>;
  /** Visits on or before `date`: how many were collected, out of those that are finished. */
  collectionRate(range: DateRange): Promise<{ collected: number; finished: number }>;
  /** Bookings made in the range: how many were confirmed (or got further). */
  confirmationRate(range: DateRange): Promise<{ confirmed: number; booked: number }>;
  pendingBookings(): Promise<number>;
  /** Paid visits that were cancelled or rejected, and payments taken twice. */
  paymentsNeedingRefund(): Promise<number>;
  collectedUnpaid(): Promise<number>;
  /** The doctors' review queue, per tab. */
  reviewQueueCounts(): Promise<{ toUpload: number; ready: number; released: number }>;
  resultsReleasedPerDay(range: DateRange): Promise<Series>;
  turnaround(range: DateRange): Promise<Turnaround>;
  /** Results released in the range, per test category, biggest first. */
  resultsByCategory(range: DateRange): Promise<{ label: string; value: number }[]>;
  /** Tests collected on a date by these teams. */
  samplesCollected(date: string, teamIds: readonly string[]): Promise<number>;
  patientSummary(patientId: string, today: string): Promise<PatientSummary>;
}
