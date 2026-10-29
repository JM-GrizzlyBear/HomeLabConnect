import type { ReportKind, ReportPreset, SavedReportView } from "@homelabconnect/shared";
import { CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { type ReportSelection, ReportControls } from "@/components/reports/ReportControls";
import { ReportResults } from "@/components/reports/ReportResults";
import { SavedReports } from "@/components/reports/SavedReports";
import { SaveReportDialog } from "@/components/reports/SaveReportDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchReport, fetchSavedReports } from "../api/reports";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { presetRange, reportKindLabels } from "../format/reports";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const KINDS = Object.keys(reportKindLabels) as ReportKind[];

/** Revenue, bookings and tests for any range, grouped by day, week or month; save and export. */
export function ReportsPage() {
  const [selection, setSelection] = useState<ReportSelection>(() => ({
    kind: "revenue",
    preset: "this_month",
    period: "day",
    ...presetRange("this_month"),
  }));
  const [saving, setSaving] = useState(false);
  const filters = { from: selection.from, to: selection.to, period: selection.period };
  const { data: report, error } = useApiQuery(
    queryKeys.report(selection.kind, filters),
    async (signal) => await fetchReport(selection.kind, filters, signal),
    {
      enabled: selection.from <= selection.to,
      errorMessage: "Could not run the report. Try again.",
    },
  );
  const { data: saved, reload: reloadSaved } = useApiQuery(
    queryKeys.savedReports,
    fetchSavedReports,
    { errorMessage: "Could not load your saved reports." },
  );

  const change = (changes: Partial<ReportSelection>) =>
    setSelection((current) => ({ ...current, ...changes }));
  const choosePreset = (preset: ReportPreset | "custom") =>
    change(preset === "custom" ? { preset } : { preset, ...presetRange(preset) });
  const open = (report: SavedReportView) =>
    setSelection({
      kind: report.kind,
      period: report.period,
      preset: report.preset ?? "custom",
      ...(report.preset
        ? presetRange(report.preset)
        : { from: report.from ?? "", to: report.to ?? "" }),
    });

  return (
    <>
      <PageHeader title="Reports" />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_18rem]">
        <div className="grid min-w-0 gap-6">
          <ContentCard title="Report">
            <Tabs
              value={selection.kind}
              onValueChange={(kind) => change({ kind: kind as ReportKind })}
            >
              <TabsList className="mb-5">
                {KINDS.map((kind) => (
                  <TabsTrigger key={kind} value={kind}>
                    {reportKindLabels[kind]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <ReportControls
              selection={selection}
              onPreset={choosePreset}
              onChange={change}
              onSave={() => setSaving(true)}
            />
          </ContentCard>
          {error ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !report ? (
            <Skeleton className="h-64 rounded-2xl" aria-label="Running the report" />
          ) : (
            <ReportResults report={report} />
          )}
        </div>
        <SavedReports reports={saved ?? []} onOpen={open} onDeleted={reloadSaved} />
      </div>
      <SaveReportDialog
        open={saving}
        selection={selection}
        onClose={() => setSaving(false)}
        onSaved={reloadSaved}
      />
    </>
  );
}
