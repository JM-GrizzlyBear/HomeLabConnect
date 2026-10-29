import type { ReviewQueueTab } from "@homelabconnect/shared";
import { CircleAlertIcon, SearchIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { Link } from "react-router";
import { EmptyState } from "@/components/data/EmptyState";
import { TablePagination } from "@/components/data/TablePagination";
import { TextInputField } from "@/components/form/TextInputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchReviewQueue } from "../api/results";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { formatVisit } from "../format/appointments";
import { paymentStatusLabels, paymentStatusVariants } from "../format/payments";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const PAGE_SIZE = 20;

const tabs: { value: ReviewQueueTab; label: string; empty: string }[] = [
  { value: "to_upload", label: "To upload", empty: "No collected visits are waiting for results." },
  { value: "ready_to_release", label: "Ready to release", empty: "Nothing is ready to release." },
  { value: "released", label: "Released", empty: "No results released yet." },
];

/** Doctors: collected visits waiting for results, ready to release, or released. */
export function ReviewQueuePage() {
  const [filters, setFilters] = useState({ tab: "to_upload" as ReviewQueueTab, q: "", page: 1 });
  const [search, setSearch] = useState("");
  const { data: list, error } = useApiQuery(
    queryKeys.reviewQueue(filters),
    async (signal) =>
      await fetchReviewQueue(
        { tab: filters.tab, q: filters.q || undefined, page: filters.page, pageSize: PAGE_SIZE },
        signal,
      ),
    { errorMessage: "Could not load the review queue. Try again." },
  );

  function applySearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim(), page: 1 }));
  }

  return (
    <>
      <PageHeader title="Review Queue" />
      <ContentCard title="Collected visits">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <Tabs
            value={filters.tab}
            onValueChange={(tab) =>
              setFilters((current) => ({ ...current, tab: tab as ReviewQueueTab, page: 1 }))
            }
          >
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <form onSubmit={applySearch} role="search" className="flex items-end gap-2">
            <TextInputField
              label="Search visits"
              hideLabel
              type="search"
              icon={<SearchIcon />}
              placeholder="Search code or patient name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 sm:w-64"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </div>

        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !list ? (
          <Skeleton className="h-40" aria-label="Loading the review queue" />
        ) : list.items.length === 0 ? (
          <EmptyState title={tabs.find((tab) => tab.value === filters.tab)!.empty} />
        ) : (
          <div className="grid gap-5">
            <Table className="min-w-160">
              <TableHeader>
                <TableRow>
                  <TableHead>Visit</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.map((item) => (
                  <TableRow key={item.appointmentId}>
                    <TableCell>
                      <span className="font-medium">{item.code}</span>
                      <p className="text-xs text-muted-foreground">
                        {formatVisit(item.date, item.slot)}
                      </p>
                    </TableCell>
                    <TableCell>{item.patientName}</TableCell>
                    <TableCell>
                      {item.testsWithResults} of {item.testsCollected} uploaded
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusVariants[item.paymentStatus]}>
                        {paymentStatusLabels[item.paymentStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/app/appointments/${item.appointmentId}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={list.page}
              pageSize={list.pageSize}
              total={list.total}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        )}
      </ContentCard>
    </>
  );
}
