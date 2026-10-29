import {
  type Report,
  type ReportKind,
  type ReportPeriod,
  reportSchema,
  type SavedReportView,
  type SaveReportRequest,
  savedReportSchema,
  savedReportsSchema,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export interface ReportFilters {
  from: string;
  to: string;
  period: ReportPeriod;
}

const query = ({ from, to, period }: ReportFilters) =>
  new URLSearchParams({ from, to, period }).toString();

export async function fetchReport(
  kind: ReportKind,
  filters: ReportFilters,
  signal?: AbortSignal,
): Promise<Report> {
  return reportSchema.parse(await apiRequest(`/reports/${kind}?${query(filters)}`, { signal }));
}

/** Where the browser downloads the report as a CSV file. */
export function reportExportUrl(kind: ReportKind, filters: ReportFilters): string {
  return `/api/reports/${kind}/export?${query(filters)}`;
}

export async function fetchSavedReports(signal?: AbortSignal): Promise<SavedReportView[]> {
  return savedReportsSchema.parse(await apiRequest("/reports/saved", { signal }));
}

export async function saveReport(request: SaveReportRequest): Promise<SavedReportView> {
  return savedReportSchema.parse(
    await apiRequest("/reports/saved", { method: "POST", body: request }),
  );
}

export async function deleteSavedReport(id: string): Promise<void> {
  await apiRequest(`/reports/saved/${id}`, { method: "DELETE" });
}
