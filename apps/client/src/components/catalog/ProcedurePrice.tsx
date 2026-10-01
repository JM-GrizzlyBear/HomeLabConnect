import type { LabProcedure } from "@homelabconnect/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPeso } from "../../format/catalog";

interface ProcedurePriceProps {
  procedure: Pick<LabProcedure, "priceCentavos" | "promotion">;
  /** Right-aligned, for table cells. */
  alignEnd?: boolean;
}

/** The list price, or the sale price with the list price struck through and the promotion's name. */
export function ProcedurePrice({ procedure, alignEnd = false }: ProcedurePriceProps) {
  const { priceCentavos, promotion } = procedure;
  if (!promotion) {
    return (
      <span className="font-medium text-slate-800 tabular-nums">{formatPeso(priceCentavos)}</span>
    );
  }
  return (
    <span className={cn("inline-flex flex-col gap-1", alignEnd ? "items-end" : "items-start")}>
      <span className="flex items-baseline gap-2 tabular-nums">
        <s
          className="text-xs text-muted-foreground"
          aria-label={`was ${formatPeso(priceCentavos)}`}
        >
          {formatPeso(priceCentavos)}
        </s>
        <span className="font-semibold text-emerald-700">
          {formatPeso(promotion.discountedPriceCentavos)}
        </span>
      </span>
      <Badge variant="warning">{promotion.name}</Badge>
    </span>
  );
}
