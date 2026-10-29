import { centavosToPesos, type Report, type SavedReportView } from "@homelabconnect/shared";
import type { ReportOutput } from "../../../application/reports/RunReport.js";
import type { SavedReport } from "../../../domain/reports/SavedReportRepository.js";
import type { HttpResponse } from "../httpTypes.js";
import { csvFile } from "./csv.js";

export function presentReport(report: ReportOutput): HttpResponse<Report> {
  return { status: 200, body: report };
}

function toSavedView(report: SavedReport): SavedReportView {
  return {
    id: report.id,
    name: report.name,
    kind: report.kind,
    period: report.period,
    preset: report.preset,
    from: report.from,
    to: report.to,
    createdAt: report.createdAt.toISOString(),
  };
}

export function presentSavedReports(reports: SavedReport[]): HttpResponse<SavedReportView[]> {
  return { status: 200, body: reports.map(toSavedView) };
}

export function presentSavedReport(report: SavedReport): HttpResponse<SavedReportView> {
  return { status: 201, body: toSavedView(report) };
}

const pesos = (centavos: number) => centavosToPesos(centavos);
const count = (value: number) => String(value);

/** The report as a spreadsheet: one row per period (or test), then a totals row. */
export function presentReportCsv(report: ReportOutput): HttpResponse<string> {
  const { from, to } = report.range;
  const filename = `${report.kind}-${from}-to-${to}.csv`;

  if (report.kind === "revenue") {
    const line = (label: string, row: Omit<(typeof report.rows)[number], "period">) => [
      label,
      pesos(row.card),
      pesos(row.cash),
      pesos(row.refunded),
      pesos(row.kept),
      count(row.payments),
    ];
    return csvFile(
      [
        ["Period", "Card (PHP)", "Cash (PHP)", "Refunded (PHP)", "Kept (PHP)", "Payments"],
        ...report.rows.map((row) => line(row.period, row)),
        line("Total", report.totals),
      ],
      filename,
    );
  }

  if (report.kind === "bookings") {
    const line = (label: string, row: Omit<(typeof report.rows)[number], "period">) => [
      label,
      ...[
        row.booked,
        row.confirmed,
        row.rejected,
        row.cancelled,
        row.collected,
        row.notCollected,
        row.returnVisits,
      ].map(count),
      `${row.collectionRate}%`,
    ];
    return csvFile(
      [
        [
          "Period",
          "Booked",
          "Confirmed",
          "Rejected",
          "Cancelled",
          "Collected",
          "Not collected",
          "Return visits",
          "Collection rate",
        ],
        ...report.rows.map((row) => line(row.period, row)),
        line("Total", report.totals),
      ],
      filename,
    );
  }

  return csvFile(
    [
      ["Code", "Test", "Category", "Ordered", "Collected", "Revenue (PHP)"],
      ...report.rows.map((row) => [
        row.code,
        row.name,
        row.category,
        count(row.ordered),
        count(row.collected),
        pesos(row.revenueCentavos),
      ]),
      [
        "Total",
        "",
        "",
        count(report.totals.ordered),
        count(report.totals.collected),
        pesos(report.totals.revenueCentavos),
      ],
    ],
    filename,
  );
}
