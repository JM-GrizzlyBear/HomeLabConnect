import { type AppointmentLineView, formatPeso } from "@homelabconnect/shared";

interface AppointmentLinesProps {
  lines: readonly AppointmentLineView[];
  subtotalCentavos: number;
  discountCentavos: number;
  totalCentavos: number;
}

/** The tests on a booking with their prices, any sale, and the total. */
export function AppointmentLines({
  lines,
  subtotalCentavos,
  discountCentavos,
  totalCentavos,
}: AppointmentLinesProps) {
  return (
    <div className="text-sm">
      <ul className="divide-y">
        {lines.map((line) => (
          <li key={line.procedureId} className="flex items-start justify-between gap-3 py-2">
            <span>
              <span className="font-medium">{line.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{line.code}</span>
              {line.promotionName && (
                <span className="block text-xs text-emerald-700">{line.promotionName}</span>
              )}
            </span>
            <span className="text-right whitespace-nowrap">
              {line.discountCentavos > 0 && (
                <span className="mr-2 text-xs text-muted-foreground line-through">
                  {formatPeso(line.priceCentavos)}
                </span>
              )}
              {formatPeso(line.priceCentavos - line.discountCentavos)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-2 space-y-1 border-t pt-2">
        {discountCentavos > 0 && (
          <>
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd>{formatPeso(subtotalCentavos)}</dd>
            </div>
            <div className="flex justify-between text-emerald-700">
              <dt>Discount</dt>
              <dd>−{formatPeso(discountCentavos)}</dd>
            </div>
          </>
        )}
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatPeso(totalCentavos)}</dd>
        </div>
      </dl>
    </div>
  );
}
