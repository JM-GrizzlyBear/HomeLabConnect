// Made-up numbers so the dashboard can be designed before the modules that
// produce the real figures exist. Every card built from this file shows a
// "Sample data" badge.
// TODO: replace each role's cards with real data as its module lands
// (appointments → Module 5, results → Module 6, payments → Module 7,
//  tickets → Module 8, reports → Module 11).
import type { BaseRole } from "@homelabconnect/shared";
import type { Bar } from "../../components/charts/BarChart";
import type { DonutSegment } from "../../components/charts/DonutChart";

const c = (shade: number) => `var(--color-brand-${shade})`;

export interface DashboardData {
  stats: { title: string; items: { label: string; value: string }[] };
  donut: { title: string; segments: DonutSegment[]; centerValue: string; centerLabel: string };
  trend: { title: string; values: number[]; tooltipTitle: string; tooltipValue: string };
  bars: {
    title: string;
    headline: string;
    caption: string;
    bars: Bar[];
    ring: { percent: number; label: string };
  };
  breakdown: { title: string; segments: DonutSegment[]; centerValue: string; centerLabel: string };
}

const fortnight = ["M", "T", "W", "Th", "F", "S", "S", "M", "T", "W", "Th", "F", "S", "S"];
const days = (values: number[]): Bar[] =>
  values.map((value, i) => ({ label: fortnight[i]!, value }));

export const sampleDashboards: Record<BaseRole, DashboardData> = {
  admin: {
    stats: {
      title: "Today at a glance",
      items: [
        { label: "Bookings", value: "18" },
        { label: "Home visits", value: "12" },
        { label: "Results released", value: "9" },
        { label: "Open tickets", value: "4" },
      ],
    },
    donut: {
      title: "Appointments today",
      centerValue: "18",
      centerLabel: "Total",
      segments: [
        { label: "Pending", value: 4, color: c(200) },
        { label: "Assigned", value: 6, color: c(400) },
        { label: "Collected", value: 5, color: c(600) },
        { label: "Completed", value: 3, color: c(800) },
      ],
    },
    trend: {
      title: "Revenue trend",
      values: [22, 28, 25, 34, 30, 41, 38, 46, 43, 52],
      tooltipTitle: "24 September",
      tooltipValue: "₱52,300",
    },
    bars: {
      title: "Bookings",
      headline: "8.9",
      caption: "Bi-weekly average",
      bars: days([7, 9, 8, 10, 6, 12, 14, 8, 9, 7, 11, 8, 13, 12]),
      ring: { percent: 86, label: "Collected" },
    },
    breakdown: {
      title: "Payments collected",
      centerValue: "95%",
      centerLabel: "Paid",
      segments: [
        { label: "Card (Stripe)", value: 62, color: c(600) },
        { label: "Cash", value: 33, color: c(300) },
        { label: "Pending", value: 5, color: c(100) },
      ],
    },
  },
  doctor: {
    stats: {
      title: "Today at a glance",
      items: [
        { label: "Awaiting review", value: "7" },
        { label: "Released today", value: "11" },
        { label: "Returned", value: "1" },
        { label: "Avg turnaround", value: "5h" },
      ],
    },
    donut: {
      title: "Review queue",
      centerValue: "7",
      centerLabel: "Waiting",
      segments: [
        { label: "Chemistry", value: 3, color: c(300) },
        { label: "Hematology", value: 2, color: c(500) },
        { label: "Urinalysis", value: 1, color: c(700) },
        { label: "Others", value: 1, color: c(900) },
      ],
    },
    trend: {
      title: "Results released",
      values: [6, 9, 7, 11, 8, 12, 10, 14, 9, 11],
      tooltipTitle: "26 September",
      tooltipValue: "14 results",
    },
    bars: {
      title: "Reviews per day",
      headline: "9.6",
      caption: "Bi-weekly average",
      bars: days([8, 10, 9, 12, 7, 3, 2, 11, 10, 12, 9, 13, 4, 2]),
      ring: { percent: 92, label: "On time" },
    },
    breakdown: {
      title: "Result types this month",
      centerValue: "214",
      centerLabel: "Results",
      segments: [
        { label: "Blood chemistry", value: 96, color: c(600) },
        { label: "CBC", value: 71, color: c(400) },
        { label: "Urinalysis", value: 47, color: c(200) },
      ],
    },
  },
  med_team: {
    stats: {
      title: "Today's route",
      items: [
        { label: "Visits today", value: "6" },
        { label: "Completed", value: "2" },
        { label: "Samples collected", value: "5" },
        { label: "Cash collected", value: "₱3,200" },
      ],
    },
    donut: {
      title: "Today's visits",
      centerValue: "6",
      centerLabel: "Visits",
      segments: [
        { label: "Completed", value: 2, color: c(700) },
        { label: "En route", value: 1, color: c(400) },
        { label: "Upcoming", value: 3, color: c(200) },
      ],
    },
    trend: {
      title: "Distance travelled",
      values: [18, 24, 21, 30, 26, 19, 28, 33, 25, 29],
      tooltipTitle: "This week",
      tooltipValue: "33 km",
    },
    bars: {
      title: "Visits per day",
      headline: "5.4",
      caption: "Bi-weekly average",
      bars: days([5, 6, 4, 7, 6, 3, 0, 6, 7, 5, 6, 8, 4, 0]),
      ring: { percent: 33, label: "Route done" },
    },
    breakdown: {
      title: "Payment methods",
      centerValue: "41",
      centerLabel: "Visits",
      segments: [
        { label: "Paid online", value: 29, color: c(600) },
        { label: "Cash on visit", value: 12, color: c(300) },
      ],
    },
  },
  support: {
    stats: {
      title: "Today at a glance",
      items: [
        { label: "Open tickets", value: "12" },
        { label: "Assigned to you", value: "5" },
        { label: "Resolved today", value: "8" },
        { label: "First reply", value: "14m" },
      ],
    },
    donut: {
      title: "Tickets by status",
      centerValue: "25",
      centerLabel: "This week",
      segments: [
        { label: "Open", value: 12, color: c(300) },
        { label: "Waiting on patient", value: 5, color: c(500) },
        { label: "Resolved", value: 8, color: c(800) },
      ],
    },
    trend: {
      title: "New tickets",
      values: [4, 7, 5, 9, 6, 8, 5, 10, 7, 6],
      tooltipTitle: "25 September",
      tooltipValue: "10 tickets",
    },
    bars: {
      title: "Resolved per day",
      headline: "7.1",
      caption: "Bi-weekly average",
      bars: days([6, 8, 7, 9, 5, 3, 2, 8, 9, 7, 10, 8, 4, 3]),
      ring: { percent: 94, label: "Satisfied" },
    },
    breakdown: {
      title: "Ticket topics",
      centerValue: "25",
      centerLabel: "Tickets",
      segments: [
        { label: "Scheduling", value: 10, color: c(600) },
        { label: "Payments", value: 8, color: c(400) },
        { label: "Results", value: 7, color: c(200) },
      ],
    },
  },
  patient: {
    stats: {
      title: "Your summary",
      items: [
        { label: "Upcoming visits", value: "1" },
        { label: "Results ready", value: "2" },
        { label: "Open tickets", value: "0" },
        { label: "Balance due", value: "₱1,850" },
      ],
    },
    donut: {
      title: "Your results",
      centerValue: "3",
      centerLabel: "Tests",
      segments: [
        { label: "Ready", value: 2, color: c(600) },
        { label: "In review", value: 1, color: c(200) },
      ],
    },
    trend: {
      title: "Spending this year",
      values: [0, 850, 850, 1850, 1850, 2700, 2700, 3550, 3550, 5400],
      tooltipTitle: "September",
      tooltipValue: "₱5,400",
    },
    bars: {
      title: "Visits by month",
      headline: "6",
      caption: "Visits this year",
      bars: ["J", "F", "M", "A", "M", "J", "J", "A", "S"].map((label, i) => ({
        label,
        value: [0, 1, 0, 1, 0, 1, 1, 0, 2][i]!,
      })),
      ring: { percent: 67, label: "Paid" },
    },
    breakdown: {
      title: "Tests taken",
      centerValue: "9",
      centerLabel: "Tests",
      segments: [
        { label: "CBC", value: 4, color: c(600) },
        { label: "Lipid panel", value: 3, color: c(400) },
        { label: "Urinalysis", value: 2, color: c(200) },
      ],
    },
  },
};
