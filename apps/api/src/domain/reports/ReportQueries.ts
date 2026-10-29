import type { ReportPeriod, ReportRange } from "./report.js";

/** Money per period, in centavos. Keys are the periods' first days. */
export interface RevenueRow {
  card: number;
  cash: number;
  refunded: number;
  payments: number;
}

export interface BookingsRow {
  booked: number;
  confirmed: number;
  rejected: number;
  cancelled: number;
  collected: number;
  notCollected: number;
  returnVisits: number;
}

export interface TestRow {
  code: string;
  name: string;
  category: string;
  ordered: number;
  collected: number;
  /** Price less discount, on visits that weren't cancelled or rejected. */
  revenueCentavos: number;
}

/** Port: the read-only figures behind the reports. Business days are Philippine time. */
export interface ReportQueries {
  /** Payments made in the range, by the period they were paid in. */
  revenue(range: ReportRange, period: ReportPeriod): Promise<Map<string, RevenueRow>>;
  /** Discounts on visits booked in the range, by promotion. */
  discounts(range: ReportRange): Promise<{ promotion: string; centavos: number; tests: number }[]>;
  /** Bookings made in the range, by the period they were made in, and what became of them. */
  bookings(range: ReportRange, period: ReportPeriod): Promise<Map<string, BookingsRow>>;
  /** The most common reasons visits were rejected or cancelled, booked in the range. */
  topReasons(range: ReportRange, limit: number): Promise<{ reason: string; count: number }[]>;
  /** Each test ordered on visits booked in the range. */
  tests(range: ReportRange): Promise<TestRow[]>;
}
