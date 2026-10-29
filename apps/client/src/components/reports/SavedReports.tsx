import type { SavedReportView } from "@homelabconnect/shared";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "../../api/apiClient";
import { deleteSavedReport } from "../../api/reports";
import { useCan } from "../../auth/useCan";
import { useFeedback } from "../../feedback/feedbackContext";
import { reportKindLabels, reportPresetLabels } from "../../format/reports";
import { ContentCard } from "../layout/ContentCard";

interface SavedReportsProps {
  reports: SavedReportView[];
  onOpen(report: SavedReportView): void;
  onDeleted(): void;
}

/** The user's own saved reports: open one in a click, or delete it. */
export function SavedReports({ reports, onOpen, onDeleted }: SavedReportsProps) {
  const can = useCan();
  const feedback = useFeedback();

  async function remove(report: SavedReportView) {
    const confirmed = await feedback.confirm({
      title: `Delete "${report.name}"?`,
      description: "Only the saved shortcut goes; the figures stay.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deleteSavedReport(report.id);
      feedback.success({ title: "Saved report deleted" });
      onDeleted();
    } catch (error) {
      feedback.error({
        title: "Couldn't delete the saved report",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <ContentCard title="Saved reports">
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Save a report you run often, like "Monthly revenue", to open it again in one click.
        </p>
      ) : (
        <ul className="grid gap-1" aria-label="Saved reports">
          {reports.map((report) => (
            <li key={report.id} className="flex items-center gap-1">
              <button
                type="button"
                className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                onClick={() => onOpen(report)}
              >
                <span className="block truncate font-medium">{report.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {reportKindLabels[report.kind]} ·{" "}
                  {report.preset
                    ? reportPresetLabels[report.preset]
                    : `${report.from} to ${report.to}`}
                </span>
              </button>
              {can("reports.save") && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Delete ${report.name}`}
                  onClick={() => void remove(report)}
                >
                  <Trash2Icon />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </ContentCard>
  );
}
