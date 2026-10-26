import { formatPeso } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { CircleAlertIcon } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/data/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyPayments } from "../api/payments";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import {
  paymentRecordStatusLabels,
  paymentRecordStatusVariants,
  providerLabels,
} from "../format/payments";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

/** A patient's payments, newest first, with any refunds. */
export function MyPaymentsPage() {
  const { data, error } = useApiQuery(queryKeys.myPayments, fetchMyPayments, {
    errorMessage: "Could not load your payments. Try again.",
  });

  return (
    <>
      <PageHeader title="My Payments" />
      <ContentCard title="Payments">
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !data ? (
          <Skeleton className="h-32" aria-label="Loading your payments" />
        ) : data.length === 0 ? (
          <EmptyState
            title="No payments yet."
            description="Pay from an appointment once it's confirmed, or in cash at the visit."
          />
        ) : (
          <ul className="divide-y" aria-label="Payments">
            {data.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <Link
                    to={`/app/appointments/${payment.appointmentId}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {payment.appointment.code}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {providerLabels[payment.provider]}
                    {payment.paidAt && ` · ${format(parseISO(payment.paidAt), "MMM d, yyyy")}`}
                  </p>
                  {payment.refunds.map((refund) => (
                    <p key={refund.id} className="text-sm text-muted-foreground">
                      Refunded {formatPeso(refund.amountCentavos)} — {refund.reason}
                    </p>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatPeso(payment.amountCentavos)}</span>
                  <Badge variant={paymentRecordStatusVariants[payment.status]}>
                    {paymentRecordStatusLabels[payment.status]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ContentCard>
    </>
  );
}
