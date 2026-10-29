import type { AppointmentStatus } from "../../domain/appointments/appointment.js";
import type { DashboardQueries, DateRange } from "../../domain/dashboard/DashboardQueries.js";
import {
  formatHours,
  formatPesos,
  lastDays,
  lastMonths,
  monthsOf,
  percent,
  topSlices,
  valuesOn,
  weekdayInitials,
} from "../../domain/dashboard/metrics.js";
import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import { businessDate } from "../../domain/time/businessDate.js";
import { myTeamIds } from "../appointments/ListMyVisits.js";
import type { Clock } from "../ports/Clock.js";

type Slice = { label: string; value: number };
interface Donut {
  title: string;
  segments: Slice[];
  centerValue: string;
  centerLabel: string;
}

/** The five cards of a dashboard, the same layout for every role. */
export interface DashboardOutput {
  stats: { title: string; items: { label: string; value: string }[] };
  donut: Donut;
  trend: { title: string; values: number[]; tooltipTitle: string; tooltipValue: string };
  bars: {
    title: string;
    headline: string;
    caption: string;
    bars: Slice[];
    ring: { percent: number; label: string };
  };
  breakdown: Donut;
}

const FORTNIGHT = 14;
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const average = (values: readonly number[]) =>
  values.length > 0 ? (Math.round((sum(values) / values.length) * 10) / 10).toString() : "0";

const STATUS_SLICES: [string, AppointmentStatus[]][] = [
  ["Pending", ["pending", "reschedule_proposed"]],
  ["Confirmed", ["confirmed"]],
  ["On the way", ["on_the_way"]],
  ["Collected", ["collected"]],
  ["Not collected", ["not_collected"]],
];

function visitSlices(byStatus: Map<AppointmentStatus, number>): Slice[] {
  return STATUS_SLICES.map(([label, statuses]) => ({
    label,
    value: sum(statuses.map((status) => byStatus.get(status) ?? 0)),
  }));
}

function donut(title: string, segments: Slice[], centerLabel: string, center?: string): Donut {
  return {
    title,
    segments,
    centerValue: center ?? String(sum(segments.map((s) => s.value))),
    centerLabel,
  };
}

/**
 * The signed-in user's dashboard, by their base role (custom roles use their base role's).
 * Every number comes from the data; "the last 14 days" end today, Philippine time.
 */
export class GetDashboard {
  constructor(
    private readonly queries: DashboardQueries,
    private readonly teams: MedTeamRepository,
    private readonly clock: Clock,
  ) {}

  async execute(user: { id: string; role: BaseRole }): Promise<DashboardOutput> {
    const today = businessDate(this.clock.now());
    const days = lastDays(today, FORTNIGHT);
    const fortnight: DateRange = { from: days[0]!, to: today };
    const month: DateRange = { from: `${today.slice(0, 7)}-01`, to: today };
    const context = { today, days, fortnight, month };

    switch (user.role) {
      case "admin":
        return await this.admin(context);
      case "doctor":
        return await this.doctor(context);
      case "med_team":
        return await this.medTeam(context, user.id);
      case "support":
        return await this.support(context, user.id);
      case "patient":
        return await this.patient(today, user.id);
    }
  }

  private async admin({ today, days, fortnight, month }: Context): Promise<DashboardOutput> {
    const q = this.queries;
    const todayRange = { from: today, to: today };
    const [bookings, byStatus, revenue, paidToday, released, rate, totals] = await Promise.all([
      q.bookingsPerDay(fortnight),
      q.visitsByStatus(today, null),
      q.revenuePerDay(fortnight),
      q.paymentTotals(todayRange, null),
      q.resultsReleasedPerDay(todayRange),
      q.collectionRate(fortnight),
      q.paymentTotals(month, null),
    ]);
    const visitsToday = visitSlices(byStatus);
    const revenueValues = valuesOn(revenue, days);
    const bookingValues = valuesOn(bookings, days);
    return {
      stats: {
        title: "Today at a glance",
        items: [
          { label: "Bookings made", value: String(bookings.get(today) ?? 0) },
          { label: "Home visits", value: String(sum(visitsToday.map((s) => s.value))) },
          { label: "Results released", value: String(released.get(today) ?? 0) },
          { label: "Payments", value: formatPesos(paidToday.card + paidToday.cash) },
        ],
      },
      donut: donut("Visits today", visitsToday, "Visits"),
      trend: {
        title: "Revenue, last 14 days",
        values: revenueValues.map((centavos) => centavos / 100),
        tooltipTitle: "Today",
        tooltipValue: formatPesos(revenueValues.at(-1) ?? 0),
      },
      bars: {
        title: "Bookings",
        headline: average(bookingValues),
        caption: "A day, last 14 days",
        bars: weekdayInitials(days).map((label, i) => ({ label, value: bookingValues[i]! })),
        ring: { percent: percent(rate.collected, rate.finished), label: "Collected" },
      },
      breakdown: donut(
        "Payments this month",
        [
          { label: "Card", value: totals.card / 100 },
          { label: "Cash", value: totals.cash / 100 },
          { label: "Refunded", value: totals.refunded / 100 },
        ],
        "Kept",
        formatPesos(totals.card + totals.cash - totals.refunded),
      ),
    };
  }

  private async doctor({ today, days, fortnight, month }: Context): Promise<DashboardOutput> {
    const q = this.queries;
    const [queue, released, turnaround, categories] = await Promise.all([
      q.reviewQueueCounts(),
      q.resultsReleasedPerDay(fortnight),
      q.turnaround(fortnight),
      q.resultsByCategory(month),
    ]);
    const releasedValues = valuesOn(released, days);
    return {
      stats: {
        title: "Today at a glance",
        items: [
          { label: "To upload", value: String(queue.toUpload) },
          { label: "Ready to release", value: String(queue.ready) },
          { label: "Released today", value: String(released.get(today) ?? 0) },
          { label: "Avg turnaround", value: formatHours(turnaround.averageHours) },
        ],
      },
      donut: donut(
        "Review queue",
        [
          { label: "To upload", value: queue.toUpload },
          { label: "Ready to release", value: queue.ready },
        ],
        "Waiting",
      ),
      trend: {
        title: "Results released, last 14 days",
        values: releasedValues,
        tooltipTitle: "Today",
        tooltipValue: `${releasedValues.at(-1) ?? 0} visits`,
      },
      bars: {
        title: "Releases per day",
        headline: average(releasedValues),
        caption: "A day, last 14 days",
        bars: weekdayInitials(days).map((label, i) => ({ label, value: releasedValues[i]! })),
        ring: {
          percent: percent(turnaround.releasedWithin24h, turnaround.released),
          label: "Within 24h",
        },
      },
      breakdown: donut("Results this month", topSlices(categories, 3), "Tests"),
    };
  }

  private async medTeam(
    { today, days, fortnight, month }: Context,
    userId: string,
  ): Promise<DashboardOutput> {
    const q = this.queries;
    const teamIds = await myTeamIds({ teams: this.teams }, userId, today);
    const todayRange = { from: today, to: today };
    const [byStatus, perDay, samples, cashToday, totals] = await Promise.all([
      q.visitsByStatus(today, teamIds),
      q.visitsPerDay(fortnight, teamIds),
      q.samplesCollected(today, teamIds),
      q.paymentTotals(todayRange, teamIds),
      q.paymentTotals(month, teamIds),
    ]);
    const done = (byStatus.get("collected") ?? 0) + (byStatus.get("not_collected") ?? 0);
    const onTheWay = byStatus.get("on_the_way") ?? 0;
    const upcoming = byStatus.get("confirmed") ?? 0;
    const total = done + onTheWay + upcoming;
    const visitValues = valuesOn(perDay, days);
    return {
      stats: {
        title: "Today's route",
        items: [
          { label: "Visits today", value: String(total) },
          { label: "Done", value: String(done) },
          { label: "Samples collected", value: String(samples) },
          { label: "Cash collected", value: formatPesos(cashToday.cash) },
        ],
      },
      donut: donut(
        "Today's visits",
        [
          { label: "Done", value: done },
          { label: "On the way", value: onTheWay },
          { label: "Upcoming", value: upcoming },
        ],
        "Visits",
      ),
      trend: {
        title: "Visits, last 14 days",
        values: visitValues,
        tooltipTitle: "Today",
        tooltipValue: `${visitValues.at(-1) ?? 0} visits`,
      },
      bars: {
        title: "Visits per day",
        headline: average(visitValues),
        caption: "A day, last 14 days",
        bars: weekdayInitials(days).map((label, i) => ({ label, value: visitValues[i]! })),
        ring: { percent: percent(done, total), label: "Route done" },
      },
      breakdown: donut(
        "Payment methods this month",
        [
          { label: "Paid online", value: totals.card / 100 },
          { label: "Cash on visit", value: totals.cash / 100 },
        ],
        "Taken",
        formatPesos(totals.card + totals.cash),
      ),
    };
  }

  private async support(
    { today, days, fortnight, month }: Context,
    agentId: string,
  ): Promise<DashboardOutput> {
    const q = this.queries;
    const [pending, byStatus, needsRefund, unpaid, bookings, rate, totals, tickets] =
      await Promise.all([
        q.pendingBookings(),
        q.visitsByStatus(today, null),
        q.paymentsNeedingRefund(),
        q.collectedUnpaid(),
        q.bookingsPerDay(fortnight),
        q.confirmationRate(fortnight),
        q.paymentTotals(month, null),
        q.openTickets(agentId),
      ]);
    const visitsToday = visitSlices(byStatus);
    const bookingValues = valuesOn(bookings, days);
    return {
      stats: {
        title: "Today at a glance",
        items: [
          { label: "Pending bookings", value: String(pending) },
          { label: "Open tickets", value: String(tickets) },
          { label: "Needs refund", value: String(needsRefund) },
          { label: "Collected, unpaid", value: String(unpaid) },
        ],
      },
      donut: donut("Visits today", visitsToday, "Visits"),
      trend: {
        title: "Bookings, last 14 days",
        values: bookingValues,
        tooltipTitle: "Today",
        tooltipValue: `${bookingValues.at(-1) ?? 0} bookings`,
      },
      bars: {
        title: "Bookings per day",
        headline: average(bookingValues),
        caption: "A day, last 14 days",
        bars: weekdayInitials(days).map((label, i) => ({ label, value: bookingValues[i]! })),
        ring: { percent: percent(rate.confirmed, rate.booked), label: "Confirmed" },
      },
      breakdown: donut(
        "Payment methods this month",
        [
          { label: "Card", value: totals.card / 100 },
          { label: "Cash", value: totals.cash / 100 },
        ],
        "Taken",
        formatPesos(totals.card + totals.cash),
      ),
    };
  }

  private async patient(today: string, patientId: string): Promise<DashboardOutput> {
    const summary = await this.queries.patientSummary(patientId, today);
    const year = Number(today.slice(0, 4));
    const monthNumber = Number(today.slice(5, 7));
    const spending = valuesOn(summary.spendingPerMonth, lastMonths(year, monthNumber, 12));
    const months = monthsOf(year, monthNumber);
    return {
      stats: {
        title: "Your summary",
        items: [
          { label: "Upcoming visits", value: String(summary.upcoming) },
          { label: "Results ready", value: String(summary.resultsReady) },
          { label: "Waiting for payment", value: String(summary.resultsLocked) },
          { label: "Balance due", value: formatPesos(summary.balanceDueCentavos) },
        ],
      },
      donut: donut(
        "Your results",
        [
          { label: "Ready", value: summary.resultsReady },
          { label: "Pay to view", value: summary.resultsLocked },
          { label: "With the doctor", value: summary.resultsPending },
        ],
        "Visits",
      ),
      trend: {
        title: "Spending, last 12 months",
        values: spending.map((centavos) => centavos / 100),
        tooltipTitle: "This month",
        tooltipValue: formatPesos(spending.at(-1) ?? 0),
      },
      bars: {
        title: "Visits by month",
        headline: String(summary.visitsThisYear),
        caption: "Visits this year",
        bars: months.map(({ key, label }) => ({
          label,
          value: summary.visitsPerMonth.get(key) ?? 0,
        })),
        ring: {
          percent: percent(summary.paidVisitsThisYear, summary.visitsThisYear),
          label: "Paid",
        },
      },
      breakdown: donut("Tests taken", topSlices(summary.testsTaken, 3), "Tests"),
    };
  }
}

interface Context {
  today: string;
  days: string[];
  fortnight: DateRange;
  month: DateRange;
}
