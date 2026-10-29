import {
  assertRange,
  periodsBetween,
  rate,
  type ReportKind,
  type ReportPeriod,
  type ReportRange,
} from "../../domain/reports/report.js";
import type {
  BookingsRow,
  ReportQueries,
  RevenueRow,
  TestRow,
} from "../../domain/reports/ReportQueries.js";

export interface RunReportInput extends ReportRange {
  kind: ReportKind;
  period: ReportPeriod;
}

export type RevenueReportRow = RevenueRow & { period: string; kept: number };
export type BookingsReportRow = BookingsRow & { period: string; collectionRate: number };

export type ReportOutput =
  | {
      kind: "revenue";
      range: ReportRange;
      period: ReportPeriod;
      rows: RevenueReportRow[];
      totals: Omit<RevenueReportRow, "period">;
      discounts: { promotion: string; centavos: number; tests: number }[];
    }
  | {
      kind: "bookings";
      range: ReportRange;
      period: ReportPeriod;
      rows: BookingsReportRow[];
      totals: Omit<BookingsReportRow, "period">;
      topReasons: { reason: string; count: number }[];
    }
  | {
      kind: "tests";
      range: ReportRange;
      rows: TestRow[];
      totals: Pick<TestRow, "ordered" | "collected" | "revenueCentavos">;
      categories: Pick<TestRow, "category" | "ordered" | "collected" | "revenueCentavos">[];
    };

const EMPTY_REVENUE: RevenueRow = { card: 0, cash: 0, refunded: 0, payments: 0 };
const EMPTY_BOOKINGS: BookingsRow = {
  booked: 0,
  confirmed: 0,
  rejected: 0,
  cancelled: 0,
  collected: 0,
  notCollected: 0,
  returnVisits: 0,
};

/** Adds up numeric fields of rows that share a shape. */
function sumRows<T extends object>(rows: readonly T[], empty: T): T {
  return rows.reduce((total, row) => {
    const next = { ...total } as Record<string, number>;
    for (const key of Object.keys(empty)) {
      next[key] = (next[key] ?? 0) + Number((row as Record<string, number>)[key] ?? 0);
    }
    return next as T;
  }, empty);
}

/**
 * One report for a date range: revenue and bookings per day, week or month (quiet periods
 * included, as zeros), or every test ordered.
 */
export class RunReport {
  constructor(private readonly queries: ReportQueries) {}

  async execute({ kind, period, ...range }: RunReportInput): Promise<ReportOutput> {
    assertRange(range);
    if (kind === "revenue") return await this.revenue(range, period);
    if (kind === "bookings") return await this.bookings(range, period);
    return await this.tests(range);
  }

  private async revenue(range: ReportRange, period: ReportPeriod): Promise<ReportOutput> {
    const [byPeriod, discounts] = await Promise.all([
      this.queries.revenue(range, period),
      this.queries.discounts(range),
    ]);
    const rows = periodsBetween(range, period).map((key) => {
      const row = byPeriod.get(key) ?? EMPTY_REVENUE;
      return { period: key, ...row, kept: row.card + row.cash - row.refunded };
    });
    const totals = sumRows(
      rows.map(({ period: _period, ...row }) => row),
      { ...EMPTY_REVENUE, kept: 0 },
    );
    return { kind: "revenue", range, period, rows, totals, discounts };
  }

  private async bookings(range: ReportRange, period: ReportPeriod): Promise<ReportOutput> {
    const [byPeriod, topReasons] = await Promise.all([
      this.queries.bookings(range, period),
      this.queries.topReasons(range, 5),
    ]);
    const withRate = (row: BookingsRow) => ({
      ...row,
      collectionRate: rate(row.collected, row.collected + row.notCollected),
    });
    const rows = periodsBetween(range, period).map((key) => ({
      period: key,
      ...withRate(byPeriod.get(key) ?? EMPTY_BOOKINGS),
    }));
    const totals = withRate(sumRows([...byPeriod.values()], EMPTY_BOOKINGS));
    return { kind: "bookings", range, period, rows, totals, topReasons };
  }

  private async tests(range: ReportRange): Promise<ReportOutput> {
    const rows = [...(await this.queries.tests(range))].sort(
      (a, b) => b.ordered - a.ordered || a.name.localeCompare(b.name),
    );
    const empty = { ordered: 0, collected: 0, revenueCentavos: 0 };
    const byCategory = new Map<string, typeof empty>();
    for (const row of rows) {
      byCategory.set(row.category, sumRows([row], byCategory.get(row.category) ?? empty));
    }
    return {
      kind: "tests",
      range,
      rows,
      totals: sumRows(rows, empty),
      categories: [...byCategory]
        .map(([category, totals]) => ({ category, ...totals }))
        .sort((a, b) => b.ordered - a.ordered),
    };
  }
}
