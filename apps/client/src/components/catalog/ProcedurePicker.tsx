import type { LabProcedure } from "@homelabconnect/shared";
import { SearchIcon } from "lucide-react";
import { useId, useState } from "react";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { formatPeso } from "../../format/catalog";

interface ProcedurePickerProps {
  procedures: readonly LabProcedure[];
  selectedIds: readonly string[];
  onChange(ids: string[]): void;
  error?: string;
}

/** A searchable checklist of procedures, for choosing what a promotion covers. */
export function ProcedurePicker({
  procedures,
  selectedIds,
  onChange,
  error,
}: ProcedurePickerProps) {
  const id = useId();
  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();
  const shown = procedures.filter(
    (procedure) =>
      !needle ||
      procedure.name.toLowerCase().includes(needle) ||
      procedure.code.toLowerCase().includes(needle) ||
      procedure.category.name.toLowerCase().includes(needle),
  );
  const selected = new Set(selectedIds);

  function toggle(procedureId: string, checked: boolean) {
    onChange(
      checked
        ? [...selectedIds, procedureId]
        : selectedIds.filter((selectedId) => selectedId !== procedureId),
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <TextInputField
          label="Find procedures"
          hideLabel
          type="search"
          size="sm"
          icon={<SearchIcon />}
          placeholder="Find by name, code or category"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="min-w-0 flex-1"
        />
        <span className="shrink-0 text-xs text-muted-foreground">{selected.size} selected</span>
        {selected.size > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
            Clear
          </Button>
        )}
      </div>
      <ul
        className="max-h-72 divide-y overflow-y-auto rounded-lg border"
        aria-invalid={error ? true : undefined}
      >
        {shown.map((procedure) => (
          <li key={procedure.id} className="flex items-center gap-3 px-3 py-2">
            <Checkbox
              id={`${id}-${procedure.id}`}
              checked={selected.has(procedure.id)}
              onCheckedChange={(checked) => toggle(procedure.id, checked === true)}
            />
            <Label
              htmlFor={`${id}-${procedure.id}`}
              className="flex min-w-0 flex-1 justify-between gap-3 font-normal"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-slate-800">{procedure.name}</span>
                <span className="text-xs text-muted-foreground">
                  {procedure.code} · {procedure.category.name}
                </span>
              </span>
              <span className="shrink-0 text-sm tabular-nums text-slate-700">
                {formatPeso(procedure.priceCentavos)}
              </span>
            </Label>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            No procedures match.
          </li>
        )}
      </ul>
      {error && <FieldError role={undefined}>{error}</FieldError>}
    </div>
  );
}
