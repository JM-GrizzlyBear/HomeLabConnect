import type { PaymentListItem, PaymentProvider, PaymentRecordStatus } from "@homelabconnect/shared";
import { CircleAlertIcon, DownloadIcon, SearchIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { TablePagination } from "@/components/data/TablePagination";
import { SelectInputField } from "@/components/form/SelectInputField";
import { TextInputField } from "@/components/form/TextInputField";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { RefundDialog } from "@/components/payments/RefundDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPayments, type PaymentFilters, paymentsExportUrl } from "../api/payments";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { paymentRecordStatusLabels, providerLabels } from "../format/payments";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const ALL = "all";
const NEEDS_REFUND = "needs_refund";
const PAGE_SIZE = 20;

const statusOptions = [
  { value: ALL, label: "Every status" },
  { value: NEEDS_REFUND, label: "Needs refund" },
  ...(["paid", "partially_refunded", "refunded", "pending", "expired"] as const).map((status) => ({
    value: status,
    label: paymentRecordStatusLabels[status],
  })),
];

const providerOptions = [
  { value: ALL, label: "Card and cash" },
  ...(Object.keys(providerLabels) as PaymentProvider[]).map((provider) => ({
    value: provider,
    label: providerLabels[provider],
  })),
];

interface Filters {
  status: string;
  provider: string;
  q: string;
  page: number;
}

/** What the filters ask the API for (shared by the list and the CSV export). */
function toApiFilters(filters: Filters): PaymentFilters {
  return {
    status:
      filters.status === ALL || filters.status === NEEDS_REFUND
        ? undefined
        : (filters.status as PaymentRecordStatus),
    needsRefund: filters.status === NEEDS_REFUND,
    provider: filters.provider === ALL ? undefined : (filters.provider as PaymentProvider),
    q: filters.q || undefined,
  };
}

/** Staff: every payment, newest first, with search, filters, a CSV export and refunds. */
export function AllPaymentsPage() {
  const can = useCan();
  const [filters, setFilters] = useState<Filters>({ status: ALL, provider: ALL, q: "", page: 1 });
  const [search, setSearch] = useState("");
  const [refunding, setRefunding] = useState<PaymentListItem | null>(null);
  const {
    data: list,
    error,
    reload,
  } = useApiQuery(
    queryKeys.allPayments(filters),
    async (signal) =>
      await fetchPayments(
        { ...toApiFilters(filters), page: filters.page, pageSize: PAGE_SIZE },
        signal,
      ),
    { errorMessage: "Could not load payments. Try again." },
  );

  function applySearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim(), page: 1 }));
  }

  return (
    <>
      <PageHeader
        title="All Payments"
        action={
          can("payments.export") && (
            <Button asChild variant="outline">
              <a href={paymentsExportUrl(toApiFilters(filters))} download>
                <DownloadIcon />
                Export CSV
              </a>
            </Button>
          )
        }
      />
      <ContentCard title="Payments">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
          <form onSubmit={applySearch} role="search" className="flex items-end gap-2">
            <TextInputField
              label="Search payments"
              hideLabel
              type="search"
              icon={<SearchIcon />}
              placeholder="Search code or patient name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <SelectInputField
            label="Status"
            hideLabel
            options={statusOptions}
            value={filters.status}
            onValueChange={(status) => setFilters((current) => ({ ...current, status, page: 1 }))}
          />
          <SelectInputField
            label="Method"
            hideLabel
            options={providerOptions}
            value={filters.provider}
            onValueChange={(provider) =>
              setFilters((current) => ({ ...current, provider, page: 1 }))
            }
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !list ? (
          <Skeleton className="h-40" aria-label="Loading payments" />
        ) : list.items.length === 0 ? (
          <EmptyState title="No payments match." description="Try another filter or search." />
        ) : (
          <div className="grid gap-5">
            <PaymentsTable
              payments={list.items}
              onRefund={can("payments.refund") ? setRefunding : undefined}
            />
            <TablePagination
              page={list.page}
              pageSize={list.pageSize}
              total={list.total}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        )}
      </ContentCard>
      <RefundDialog payment={refunding} onClose={() => setRefunding(null)} onRefunded={reload} />
    </>
  );
}
