import type { TicketQueueQuery } from "@homelabconnect/shared";
import { CircleAlertIcon, SearchIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { SelectInputField } from "@/components/form/SelectInputField";
import { TextInputField } from "@/components/form/TextInputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchTicketQueue } from "../api/support";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { TicketTable } from "../components/support/TicketTable";
import { ticketCategoryLabels, ticketPriorityLabels, ticketStatusLabels } from "../format/support";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

type Scope = TicketQueueQuery["scope"];

const scopes: { value: Scope; label: string; empty: string }[] = [
  { value: "mine", label: "Mine", empty: "Nothing assigned to you right now." },
  { value: "unassigned", label: "Unassigned", empty: "Every ticket has an agent." },
  { value: "all", label: "All", empty: "No tickets match." },
];

const ANY = "any";
const options = (labels: Record<string, string>, any: string) => [
  { value: ANY, label: any },
  ...Object.entries(labels).map(([value, label]) => ({ value, label })),
];
const statusOptions = [
  { value: "active", label: "Open (not closed)" },
  ...Object.entries(ticketStatusLabels).map(([value, label]) => ({ value, label })),
];

/** Support: tickets assigned to me, waiting for someone, or all of them. */
export function TicketQueuePage() {
  const [filters, setFilters] = useState({
    scope: "mine" as Scope,
    status: "active",
    category: ANY,
    priority: ANY,
    q: "",
  });
  const [search, setSearch] = useState("");
  const change = (changes: Partial<typeof filters>) =>
    setFilters((current) => ({ ...current, ...changes }));
  const { data: tickets, error } = useApiQuery(
    queryKeys.ticketQueue(filters),
    async (signal) =>
      await fetchTicketQueue(
        {
          scope: filters.scope,
          status: filters.status as TicketQueueQuery["status"],
          category:
            filters.category === ANY
              ? undefined
              : (filters.category as TicketQueueQuery["category"]),
          priority:
            filters.priority === ANY
              ? undefined
              : (filters.priority as TicketQueueQuery["priority"]),
          q: filters.q || undefined,
        },
        signal,
      ),
    { errorMessage: "Could not load the ticket queue. Try again." },
  );

  function applySearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    change({ q: search.trim() });
  }

  return (
    <>
      <PageHeader title="Ticket Queue" />
      <ContentCard title="Tickets">
        <div className="mb-5 grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Tabs
              value={filters.scope}
              onValueChange={(scope) => change({ scope: scope as Scope })}
            >
              <TabsList>
                {scopes.map((scope) => (
                  <TabsTrigger key={scope.value} value={scope.value}>
                    {scope.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <form onSubmit={applySearch} role="search" className="flex items-end gap-2">
              <TextInputField
                label="Search tickets"
                hideLabel
                type="search"
                icon={<SearchIcon />}
                placeholder="Search subject, code or patient"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 sm:w-64"
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectInputField
              label="Status"
              size="sm"
              options={statusOptions}
              value={filters.status}
              onValueChange={(status) => change({ status })}
            />
            <SelectInputField
              label="Category"
              size="sm"
              options={options(ticketCategoryLabels, "Any category")}
              value={filters.category}
              onValueChange={(category) => change({ category })}
            />
            <SelectInputField
              label="Priority"
              size="sm"
              options={options(ticketPriorityLabels, "Any priority")}
              value={filters.priority}
              onValueChange={(priority) => change({ priority })}
            />
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !tickets ? (
          <Skeleton className="h-40" aria-label="Loading the ticket queue" />
        ) : tickets.length === 0 ? (
          <EmptyState title={scopes.find((scope) => scope.value === filters.scope)!.empty} />
        ) : (
          <TicketTable tickets={tickets} view="support" label="Tickets" />
        )}
      </ContentCard>
    </>
  );
}
