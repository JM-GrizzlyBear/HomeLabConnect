import type { LabProcedure } from "@homelabconnect/shared";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatFasting, formatTurnaround, specimenLabels } from "../../format/catalog";
import { ProcedurePrice } from "./ProcedurePrice";

interface ProcedureDetailsSheetProps {
  /** The procedure to show, or null when closed. */
  procedure: LabProcedure | null;
  onClose(): void;
}

/** A read-only side panel with what a patient needs to know before booking. */
export function ProcedureDetailsSheet({ procedure, onClose }: ProcedureDetailsSheetProps) {
  return (
    <Sheet open={procedure !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {procedure && (
          <>
            <SheetHeader>
              <SheetTitle>{procedure.name}</SheetTitle>
              <SheetDescription>
                {procedure.code} · {procedure.category.name}
              </SheetDescription>
            </SheetHeader>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 px-4 text-sm">
              <dt className="text-muted-foreground">Price</dt>
              <dd>
                <ProcedurePrice procedure={procedure} />
              </dd>
              <dt className="text-muted-foreground">Specimen</dt>
              <dd>{specimenLabels[procedure.specimen]}</dd>
              <dt className="text-muted-foreground">Results in</dt>
              <dd>{formatTurnaround(procedure.turnaroundHours)}</dd>
              <dt className="text-muted-foreground">Fasting</dt>
              <dd>{formatFasting(procedure.fastingHours)}</dd>
            </dl>
            {procedure.description && (
              <section className="px-4">
                <h3 className="mb-1 text-sm font-medium text-slate-800">About this test</h3>
                <p className="text-sm text-muted-foreground">{procedure.description}</p>
              </section>
            )}
            {procedure.preparation && (
              <section className="px-4 pb-6">
                <h3 className="mb-1 text-sm font-medium text-slate-800">How to prepare</h3>
                <p className="text-sm text-muted-foreground">{procedure.preparation}</p>
              </section>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
