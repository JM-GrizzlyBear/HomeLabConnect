import type { ReportKind, ReportPeriod, ReportPreset } from "@homelabconnect/shared";
import { DownloadIcon, SaveIcon } from "lucide-react";
import { DatePickerField } from "@/components/form/DatePicker";
import { SelectInputField } from "@/components/form/SelectInputField";
import { Button } from "@/components/ui/button";
import { reportExportUrl } from "../../api/reports";
import { useCan } from "../../auth/useCan";
import { reportPeriodLabels, reportPresetLabels } from "../../format/reports";

/** What a report is run for: a preset or a custom range, and how rows are grouped. */
export interface ReportSelection {
  kind: ReportKind;
  preset: ReportPreset | "custom";
  from: string;
  to: string;
  period: ReportPeriod;
}

const periodOptions = (Object.keys(reportPeriodLabels) as ReportPeriod[]).map((period) => ({
  value: period,
  label: reportPeriodLabels[period],
}));

interface ReportControlsProps {
  selection: ReportSelection;
  onPreset(preset: ReportPreset | "custom"): void;
  onChange(changes: Partial<ReportSelection>): void;
  onSave(): void;
}

/** Presets (or a custom range), grouping, and the Export / Save buttons. */
export function ReportControls({ selection, onPreset, onChange, onSave }: ReportControlsProps) {
  const can = useCan();
  const presets = [...(Object.keys(reportPresetLabels) as ReportPreset[]), "custom" as const];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Date range">
        {presets.map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant={selection.preset === preset ? "default" : "outline"}
            aria-pressed={selection.preset === preset}
            onClick={() => onPreset(preset)}
          >
            {preset === "custom" ? "Custom" : reportPresetLabels[preset]}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {selection.preset === "custom" && (
          <>
            <DatePickerField
              label="From"
              value={selection.from}
              max={selection.to}
              onChange={(from) => onChange({ from })}
              className="w-44"
            />
            <DatePickerField
              label="To"
              value={selection.to}
              min={selection.from}
              onChange={(to) => onChange({ to })}
              className="w-44"
            />
          </>
        )}
        {selection.kind !== "tests" && (
          <SelectInputField
            label="Group by"
            options={periodOptions}
            value={selection.period}
            onValueChange={(period) => onChange({ period: period as ReportPeriod })}
            className="w-36"
          />
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {can("reports.export") && (
            <Button asChild variant="outline">
              <a href={reportExportUrl(selection.kind, selection)} download>
                <DownloadIcon />
                Export CSV
              </a>
            </Button>
          )}
          {can("reports.save") && (
            <Button variant="outline" onClick={onSave}>
              <SaveIcon />
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
