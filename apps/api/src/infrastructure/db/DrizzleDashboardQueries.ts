import { sql, type SQL } from "drizzle-orm";
import type { AppointmentStatus } from "../../domain/appointments/appointment.js";
import type {
  DashboardQueries,
  DateRange,
  PatientSummary,
  PaymentTotals,
  Series,
  Turnaround,
} from "../../domain/dashboard/DashboardQueries.js";
import type { Database } from "./client.js";

/** The business day (Philippine time) of a timestamp column, as text "YYYY-MM-DD". */
const day = (column: SQL) => sql`((${column}) at time zone 'Asia/Manila')::date`;
const inRange = (expression: SQL, { from, to }: DateRange) =>
  sql`${expression} between ${from}::date and ${to}::date`;
/** Narrows to these teams' visits; null means every visit. */
const ofTeams = (teamIds: readonly string[] | null) => {
  if (teamIds === null) return sql`true`;
  if (teamIds.length === 0) return sql`false`;
  return sql`a.team_id in (${sql.join(
    teamIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  )})`;
};
const SETTLED = sql`('paid', 'partially_refunded', 'refunded')`;

export class DrizzleDashboardQueries implements DashboardQueries {
  constructor(private readonly db: Database) {}

  async bookingsPerDay(range: DateRange): Promise<Series> {
    return await this.series(sql`
      select ${day(sql`a.created_at`)}::text as key, count(*) as value
      from appointments a
      where ${inRange(day(sql`a.created_at`), range)}
      group by 1`);
  }

  async visitsByStatus(
    date: string,
    teamIds: readonly string[] | null,
  ): Promise<Map<AppointmentStatus, number>> {
    const rows = await this.rows<{ key: AppointmentStatus; value: string }>(sql`
      select a.status as key, count(*) as value
      from appointments a
      where a.visit_date = ${date}::date and ${ofTeams(teamIds)}
      group by 1`);
    return new Map(rows.map((row) => [row.key, Number(row.value)]));
  }

  async visitsPerDay(range: DateRange, teamIds: readonly string[] | null): Promise<Series> {
    return await this.series(sql`
      select a.visit_date::text as key, count(*) as value
      from appointments a
      where ${inRange(sql`a.visit_date`, range)}
        and a.status not in ('cancelled', 'rejected') and ${ofTeams(teamIds)}
      group by 1`);
  }

  async revenuePerDay(range: DateRange): Promise<Series> {
    return await this.series(sql`
      select ${day(sql`p.paid_at`)}::text as key,
             sum(p.amount_centavos - p.refunded_centavos) as value
      from payments p
      where p.status in ${SETTLED} and ${inRange(day(sql`p.paid_at`), range)}
      group by 1`);
  }

  async paymentTotals(range: DateRange, teamIds: readonly string[] | null): Promise<PaymentTotals> {
    const [row] = await this.rows<{ card: string; cash: string; refunded: string }>(sql`
      select
        coalesce(sum(p.amount_centavos) filter (where p.provider = 'stripe'), 0) as card,
        coalesce(sum(p.amount_centavos) filter (where p.provider = 'cash'), 0) as cash,
        coalesce(sum(p.refunded_centavos), 0) as refunded
      from payments p
      join appointments a on a.id = p.appointment_id
      where p.status in ${SETTLED} and ${inRange(day(sql`p.paid_at`), range)}
        and ${ofTeams(teamIds)}`);
    return { card: Number(row?.card), cash: Number(row?.cash), refunded: Number(row?.refunded) };
  }

  async collectionRate(range: DateRange): Promise<{ collected: number; finished: number }> {
    const [row] = await this.rows<{ collected: string; finished: string }>(sql`
      select count(*) filter (where a.status = 'collected') as collected,
             count(*) filter (where a.status in ('collected', 'not_collected')) as finished
      from appointments a
      where ${inRange(sql`a.visit_date`, range)}`);
    return { collected: Number(row?.collected), finished: Number(row?.finished) };
  }

  async confirmationRate(range: DateRange): Promise<{ confirmed: number; booked: number }> {
    const [row] = await this.rows<{ confirmed: string; booked: string }>(sql`
      select count(*) filter (
               where a.status in ('confirmed', 'reschedule_proposed', 'on_the_way', 'collected', 'not_collected')
             ) as confirmed,
             count(*) as booked
      from appointments a
      where ${inRange(day(sql`a.created_at`), range)}`);
    return { confirmed: Number(row?.confirmed), booked: Number(row?.booked) };
  }

  async pendingBookings(): Promise<number> {
    return await this.count(
      sql`select count(*) as value from appointments a where a.status = 'pending'`,
    );
  }

  async openTickets(agentId: string): Promise<number> {
    return await this.count(sql`
      select count(*) as value from support_tickets t
      where t.status <> 'closed' and (t.assigned_to = ${agentId} or t.assigned_to is null)
    `);
  }

  async paymentsNeedingRefund(): Promise<number> {
    return await this.count(sql`
      select count(*) as value
      from payments p
      join appointments a on a.id = p.appointment_id
      where p.status in ('paid', 'partially_refunded')
        and p.amount_centavos > p.refunded_centavos
        and (p.duplicate or a.status in ('cancelled', 'rejected'))`);
  }

  async collectedUnpaid(): Promise<number> {
    return await this.count(sql`
      select count(*) as value from appointments a
      where a.status = 'collected' and a.payment_status = 'unpaid'`);
  }

  async reviewQueueCounts(): Promise<{ toUpload: number; ready: number; released: number }> {
    const [row] = await this.rows<{ to_upload: string; ready: string; released: string }>(sql`
      with visits as (
        select a.id,
               (select count(*) from appointment_procedures ap
                 where ap.appointment_id = a.id and ap.collected = true) as needed,
               (select count(*) from test_results r where r.appointment_id = a.id) as uploaded,
               (select max(r.released_at) from test_results r where r.appointment_id = a.id) as released_at
        from appointments a where a.status = 'collected'
      )
      select count(*) filter (where released_at is null and uploaded < needed) as to_upload,
             count(*) filter (where released_at is null and uploaded >= needed) as ready,
             count(*) filter (where released_at is not null) as released
      from visits`);
    return {
      toUpload: Number(row?.to_upload),
      ready: Number(row?.ready),
      released: Number(row?.released),
    };
  }

  async resultsReleasedPerDay(range: DateRange): Promise<Series> {
    return await this.series(sql`
      select ${day(sql`released_at`)}::text as key, count(distinct appointment_id) as value
      from test_results
      where released_at is not null and ${inRange(day(sql`released_at`), range)}
      group by 1`);
  }

  async turnaround(range: DateRange): Promise<Turnaround> {
    const [row] = await this.rows<{ released: string; hours: string | null; on_time: string }>(sql`
      with released as (
        select r.appointment_id, max(r.released_at) as released_at,
               (select max(e.at) from appointment_events e
                 where e.appointment_id = r.appointment_id and e.kind = 'collected') as collected_at
        from test_results r
        where r.released_at is not null
        group by r.appointment_id
      )
      select count(*) as released,
             avg(extract(epoch from released_at - collected_at) / 3600) as hours,
             count(*) filter (where released_at - collected_at <= interval '24 hours') as on_time
      from released
      where collected_at is not null and ${inRange(day(sql`released_at`), range)}`);
    return {
      released: Number(row?.released),
      averageHours: row?.hours === null || row?.hours === undefined ? null : Number(row.hours),
      releasedWithin24h: Number(row?.on_time),
    };
  }

  async resultsByCategory(range: DateRange): Promise<{ label: string; value: number }[]> {
    const rows = await this.rows<{ label: string; value: string }>(sql`
      select c.name as label, count(*) as value
      from test_results r
      join lab_procedures lp on lp.id = r.procedure_id
      join procedure_categories c on c.id = lp.category_id
      where r.released_at is not null and ${inRange(day(sql`r.released_at`), range)}
      group by c.name`);
    return rows.map((row) => ({ label: row.label, value: Number(row.value) }));
  }

  async samplesCollected(date: string, teamIds: readonly string[]): Promise<number> {
    return await this.count(sql`
      select count(*) as value
      from appointment_procedures ap
      join appointments a on a.id = ap.appointment_id
      where ap.collected = true and a.visit_date = ${date}::date and ${ofTeams(teamIds)}`);
  }

  async patientSummary(patientId: string, today: string): Promise<PatientSummary> {
    const year = today.slice(0, 4);
    const [summary] = await this.rows<{
      upcoming: string;
      ready: string;
      locked: string;
      pending: string;
      balance: string;
      visits: string;
      paid_visits: string;
    }>(sql`
      with mine as (
        select a.*,
               (select max(r.released_at) from test_results r where r.appointment_id = a.id) as released_at
        from appointments a where a.patient_user_id = ${patientId}::uuid
      )
      select
        count(*) filter (where visit_date >= ${today}::date
          and status in ('pending', 'confirmed', 'reschedule_proposed', 'on_the_way')) as upcoming,
        count(*) filter (where status = 'collected' and released_at is not null and payment_status <> 'unpaid') as ready,
        count(*) filter (where status = 'collected' and released_at is not null and payment_status = 'unpaid') as locked,
        count(*) filter (where status = 'collected' and released_at is null) as pending,
        coalesce(sum(total_centavos) filter (
          where payment_status = 'unpaid' and status in ('confirmed', 'reschedule_proposed', 'on_the_way', 'collected')
        ), 0) as balance,
        count(*) filter (where status = 'collected' and extract(year from visit_date) = ${Number(year)}) as visits,
        count(*) filter (where status = 'collected' and extract(year from visit_date) = ${Number(year)}
          and payment_status <> 'unpaid') as paid_visits
      from mine`);
    const spendingPerMonth = await this.series(sql`
      select to_char(${day(sql`p.paid_at`)}, 'YYYY-MM') as key,
             sum(p.amount_centavos - p.refunded_centavos) as value
      from payments p join appointments a on a.id = p.appointment_id
      where a.patient_user_id = ${patientId}::uuid and p.status in ${SETTLED}
      group by 1`);
    const visitsPerMonth = await this.series(sql`
      select to_char(a.visit_date, 'YYYY-MM') as key, count(*) as value
      from appointments a
      where a.patient_user_id = ${patientId}::uuid and a.status = 'collected'
      group by 1`);
    const tests = await this.rows<{ label: string; value: string }>(sql`
      select ap.name as label, count(*) as value
      from appointment_procedures ap join appointments a on a.id = ap.appointment_id
      where a.patient_user_id = ${patientId}::uuid and ap.collected = true
      group by ap.name`);
    return {
      upcoming: Number(summary?.upcoming),
      resultsReady: Number(summary?.ready),
      resultsLocked: Number(summary?.locked),
      resultsPending: Number(summary?.pending),
      balanceDueCentavos: Number(summary?.balance),
      spendingPerMonth,
      visitsPerMonth,
      visitsThisYear: Number(summary?.visits),
      paidVisitsThisYear: Number(summary?.paid_visits),
      testsTaken: tests.map((row) => ({ label: row.label, value: Number(row.value) })),
    };
  }

  private async rows<T>(query: SQL): Promise<T[]> {
    const result = await this.db.execute(query);
    return result.rows as T[];
  }

  private async series(query: SQL): Promise<Series> {
    const rows = await this.rows<{ key: string; value: string }>(query);
    return new Map(rows.map((row) => [row.key, Number(row.value)]));
  }

  private async count(query: SQL): Promise<number> {
    const [row] = await this.rows<{ value: string }>(query);
    return Number(row?.value ?? 0);
  }
}
