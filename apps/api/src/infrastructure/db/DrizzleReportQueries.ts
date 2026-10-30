import { sql, type SQL } from "drizzle-orm";
import type { ReportPeriod, ReportRange } from "../../domain/reports/report.js";
import type {
  BookingsRow,
  ReportQueries,
  RevenueRow,
  TestRow,
} from "../../domain/reports/ReportQueries.js";
import type { Database } from "./client.js";

/** The business day (Philippine time) of a timestamp. */
const day = (column: SQL) => sql`((${column}) at time zone 'Asia/Manila')::date`;
const inRange = (expression: SQL, { from, to }: ReportRange) =>
  sql`${expression} between ${from}::date and ${to}::date`;
/** The first day of the day, week (Monday) or month a date falls in, as "YYYY-MM-DD". */
const periodOf = (date: SQL, period: ReportPeriod) =>
  period === "day"
    ? sql`(${date})::text`
    : sql`date_trunc(${sql.raw(`'${period}'`)}, ${date})::date::text`;

/** Visits that still count (not cancelled or rejected). */
const KEPT = sql`a.status not in ('cancelled', 'rejected')`;

export class DrizzleReportQueries implements ReportQueries {
  constructor(private readonly db: Database) {}

  async revenue(range: ReportRange, period: ReportPeriod): Promise<Map<string, RevenueRow>> {
    const paidDay = day(sql`p.paid_at`);
    const rows = await this.rows<{
      key: string;
      card: string;
      cash: string;
      refunded: string;
      payments: string;
    }>(sql`
      select ${periodOf(paidDay, period)} as key,
             coalesce(sum(p.amount_centavos) filter (where p.provider = 'stripe'), 0) as card,
             coalesce(sum(p.amount_centavos) filter (where p.provider = 'cash'), 0) as cash,
             coalesce(sum(p.refunded_centavos), 0) as refunded,
             count(*) as payments
      from payments p
      where p.status in ('paid', 'partially_refunded', 'refunded') and ${inRange(paidDay, range)}
      group by 1`);
    return new Map(
      rows.map((row) => [
        row.key,
        {
          card: Number(row.card),
          cash: Number(row.cash),
          refunded: Number(row.refunded),
          payments: Number(row.payments),
        },
      ]),
    );
  }

  async discounts(
    range: ReportRange,
  ): Promise<{ promotion: string; centavos: number; tests: number }[]> {
    const rows = await this.rows<{ promotion: string; centavos: string; tests: string }>(sql`
      select ap.promotion_name as promotion,
             sum(ap.discount_centavos) as centavos,
             count(*) as tests
      from appointment_procedures ap
      join appointments a on a.id = ap.appointment_id
      where ap.discount_centavos > 0 and ap.promotion_name is not null and ${KEPT}
        and ${inRange(day(sql`a.created_at`), range)}
      group by ap.promotion_name
      order by 2 desc`);
    return rows.map((row) => ({
      promotion: row.promotion,
      centavos: Number(row.centavos),
      tests: Number(row.tests),
    }));
  }

  async bookings(range: ReportRange, period: ReportPeriod): Promise<Map<string, BookingsRow>> {
    const bookedDay = day(sql`a.created_at`);
    const rows = await this.rows<Record<keyof BookingsRow | "key", string>>(sql`
      select ${periodOf(bookedDay, period)} as key,
             count(*) as booked,
             count(*) filter (where a.status in
               ('confirmed', 'reschedule_proposed', 'on_the_way', 'collected', 'not_collected')
             ) as confirmed,
             count(*) filter (where a.status = 'rejected') as rejected,
             count(*) filter (where a.status = 'cancelled') as cancelled,
             count(*) filter (where a.status = 'collected') as collected,
             count(*) filter (where a.status = 'not_collected') as "notCollected",
             count(*) filter (where a.return_of_id is not null) as "returnVisits"
      from appointments a
      where ${inRange(bookedDay, range)}
      group by 1`);
    return new Map(
      rows.map(({ key, ...row }) => [
        key,
        {
          booked: Number(row.booked),
          confirmed: Number(row.confirmed),
          rejected: Number(row.rejected),
          cancelled: Number(row.cancelled),
          collected: Number(row.collected),
          notCollected: Number(row.notCollected),
          returnVisits: Number(row.returnVisits),
        },
      ]),
    );
  }

  async topReasons(
    range: ReportRange,
    limit: number,
  ): Promise<{ reason: string; count: number }[]> {
    const rows = await this.rows<{ reason: string; count: string }>(sql`
      select coalesce(nullif(trim(a.decision_note), ''), 'No reason given') as reason,
             count(*) as count
      from appointments a
      where a.status in ('rejected', 'cancelled') and ${inRange(day(sql`a.created_at`), range)}
      group by 1
      order by 2 desc, 1
      limit ${limit}`);
    return rows.map((row) => ({ reason: row.reason, count: Number(row.count) }));
  }

  async ratings(range: ReportRange): Promise<{ average: number | null; count: number }> {
    const [row] = await this.rows<{ average: string | null; count: string }>(sql`
      select round(avg(r.rating)::numeric, 1) as average, count(*) as count
      from appointment_reviews r
      join appointments a on a.id = r.appointment_id
      where ${inRange(day(sql`a.created_at`), range)}`);
    return {
      average: row?.average == null ? null : Number(row.average),
      count: Number(row?.count ?? 0),
    };
  }

  async tests(range: ReportRange): Promise<TestRow[]> {
    const rows = await this.rows<{
      code: string;
      name: string;
      category: string;
      ordered: string;
      collected: string;
      revenue: string;
    }>(sql`
      select ap.code, ap.name,
             coalesce(c.name, 'Uncategorised') as category,
             count(*) as ordered,
             count(*) filter (where ap.collected = true) as collected,
             coalesce(sum(ap.price_centavos - ap.discount_centavos) filter (where ${KEPT}), 0) as revenue
      from appointment_procedures ap
      join appointments a on a.id = ap.appointment_id
      left join lab_procedures lp on lp.id = ap.procedure_id
      left join procedure_categories c on c.id = lp.category_id
      where ${inRange(day(sql`a.created_at`), range)}
      group by ap.code, ap.name, c.name`);
    return rows.map((row) => ({
      code: row.code,
      name: row.name,
      category: row.category,
      ordered: Number(row.ordered),
      collected: Number(row.collected),
      revenueCentavos: Number(row.revenue),
    }));
  }

  private async rows<T>(query: SQL): Promise<T[]> {
    const result = await this.db.execute(query);
    return result.rows as T[];
  }
}
