import type { PaymentListItem } from "@homelabconnect/shared";
import { CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { TablePagination } from "@/components/data/TablePagination";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { RefundDialog } from "@/components/payments/RefundDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchPayments } from "../api/payments";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const PAGE_SIZE = 20;
type Tab = "needs_refund" | "refundable";

/**
 * Admin: payments to give back. "Needs refund" lists paid visits that were cancelled or
 * rejected; "Any payment" lists every payment with money left to refund.
 */
export function RefundsPage() {
  const [tab, setTab] = useState<Tab>("needs_refund");
  const [page, setPage] = useState(1);
  const [refunding, setRefunding] = useState<PaymentListItem | null>(null);
  const filters = { needsRefund: tab === "needs_refund", refundable: true, page };
  const {
    data: list,
    error,
    reload,
  } = useApiQuery(
    queryKeys.allPayments(filters),
    async (signal) => await fetchPayments({ ...filters, pageSize: PAGE_SIZE }, signal),
    { errorMessage: "Could not load payments. Try again." },
  );

  return (
    <>
      <PageHeader title="Refunds" />
      <ContentCard title="Payments to refund">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as Tab);
            setPage(1);
          }}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="needs_refund">Needs refund</TabsTrigger>
            <TabsTrigger value="refundable">Any payment</TabsTrigger>
          </TabsList>
        </Tabs>
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !list ? (
          <Skeleton className="h-40" aria-label="Loading payments" />
        ) : list.items.length === 0 ? (
          <EmptyState
            title={tab === "needs_refund" ? "Nothing waiting for a refund." : "No payments yet."}
            description={
              tab === "needs_refund"
                ? "Paid visits that get cancelled or rejected show here."
                : undefined
            }
          />
        ) : (
          <div className="grid gap-5">
            <PaymentsTable payments={list.items} onRefund={setRefunding} />
            <TablePagination
              page={list.page}
              pageSize={list.pageSize}
              total={list.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </ContentCard>
      <RefundDialog payment={refunding} onClose={() => setRefunding(null)} onRefunded={reload} />
    </>
  );
}
