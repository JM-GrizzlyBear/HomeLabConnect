import type { AuditGroup } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { CircleAlertIcon, SearchIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { TablePagination } from "@/components/data/TablePagination";
import { DatePickerField } from "@/components/form/DatePicker";
import { SelectInputField } from "@/components/form/SelectInputField";
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
import { fetchAuditLog } from "../api/audit";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { auditActionLabels, auditGroupLabels, shortBrowser } from "../format/audit";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const ALL = "all";
const PAGE_SIZE = 50;

const groupOptions = [
  { value: ALL, label: "Everything" },
  ...(Object.keys(auditGroupLabels) as AuditGroup[]).map((group) => ({
    value: group,
    label: auditGroupLabels[group],
  })),
];

interface Filters {
  group: string;
  q: string;
  from: string;
  to: string;
  page: number;
}

/** Admins: who signed in (or tried to) and who changed what, newest first. */
export function AuditLogsPage() {
  const [filters, setFilters] = useState<Filters>({ group: ALL, q: "", from: "", to: "", page: 1 });
  const [search, setSearch] = useState("");
  const { data: log, error } = useApiQuery(
    queryKeys.auditLog(filters),
    async (signal) =>
      await fetchAuditLog(
        {
          group: filters.group === ALL ? undefined : (filters.group as AuditGroup),
          q: filters.q || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          page: filters.page,
          pageSize: PAGE_SIZE,
        },
        signal,
      ),
    { errorMessage: "Could not load the audit log. Try again." },
  );
  const change = (changes: Partial<Filters>) =>
    setFilters((current) => ({ ...current, ...changes, page: 1 }));

  function applySearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    change({ q: search.trim() });
  }

  return (
    <>
      <PageHeader title="Audit Logs" />
      <ContentCard title="Activity">
        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_12rem_11rem_11rem]">
          <form onSubmit={applySearch} role="search" className="flex items-end gap-2">
            <TextInputField
              label="Search the log"
              hideLabel
              type="search"
              icon={<SearchIcon />}
              placeholder="Search a person or detail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <SelectInputField
            label="What"
            hideLabel
            options={groupOptions}
            value={filters.group}
            onValueChange={(group) => change({ group })}
          />
          <DatePickerField
            label="From"
            hideLabel
            required={false}
            placeholder="From"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(from) => change({ from })}
          />
          <DatePickerField
            label="To"
            hideLabel
            required={false}
            placeholder="To"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(to) => change({ to })}
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !log ? (
          <Skeleton className="h-40" aria-label="Loading the audit log" />
        ) : log.items.length === 0 ? (
          <EmptyState title="Nothing recorded." description="Try another filter or date." />
        ) : (
          <div className="grid gap-5">
            <Table className="min-w-200">
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>What</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>From</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(entry.at), "MMM d, yyyy h:mm:ss a")}
                    </TableCell>
                    <TableCell>
                      {entry.actor ? (
                        <>
                          {entry.actor.name}
                          <p className="text-xs text-muted-foreground">{entry.actor.email}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.action === "auth.login_failed" ? (
                        <Badge variant="destructive">{auditActionLabels[entry.action]}</Badge>
                      ) : (
                        (auditActionLabels[entry.action] ?? entry.action)
                      )}
                    </TableCell>
                    <TableCell className="max-w-72 truncate" title={entry.summary ?? undefined}>
                      {entry.summary ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {entry.ip ?? "—"}
                      <p className="text-xs text-muted-foreground">
                        {shortBrowser(entry.userAgent)}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={log.page}
              pageSize={log.pageSize}
              total={log.total}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        )}
      </ContentCard>
    </>
  );
}
