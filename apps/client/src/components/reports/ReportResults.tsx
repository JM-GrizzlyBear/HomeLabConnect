import { formatPeso, type Report } from "@homelabconnect/shared";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { barLabel, periodLabel } from "../../format/reports";
import { BarChart } from "../charts/BarChart";
import { ContentCard } from "../layout/ContentCard";

/** A report's figures: totals at a glance, a chart over time, then the tables. */
export function ReportResults({ report }: { report: Report }) {
  if (report.kind === "revenue") return <RevenueResults report={report} />;
  if (report.kind === "bookings") return <BookingsResults report={report} />;
  return <TestsResults report={report} />;
}

type Of<K extends Report["kind"]> = Extract<Report, { kind: K }>;

function Tiles({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-brand-50 px-4 py-3">
          <dt className="text-xs font-medium text-brand-800/70">{item.label}</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A table with a header row, body rows and a bold totals row. */
function FiguresTable({
  label,
  head,
  rows,
  total,
}: {
  label: string;
  head: string[];
  rows: { key: string; cells: ReactNode[] }[];
  total?: ReactNode[];
}) {
  return (
    <Table className="min-w-160" aria-label={label}>
      <TableHeader>
        <TableRow>
          {head.map((cell, i) => (
            <TableHead key={cell} className={i > 0 ? "text-right" : undefined}>
              {cell}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            {row.cells.map((cell, i) => (
              <TableCell key={i} className={i > 0 ? "text-right tabular-nums" : undefined}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      {total && (
        <TableFooter>
          <TableRow className="font-semibold">
            {total.map((cell, i) => (
              <TableCell key={i} className={i > 0 ? "text-right tabular-nums" : undefined}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}

function RevenueResults({ report }: { report: Of<"revenue"> }) {
  const { totals } = report;
  return (
    <div className="grid gap-6">
      <Tiles
        items={[
          { label: "Kept", value: formatPeso(totals.kept) },
          { label: "Card", value: formatPeso(totals.card) },
          { label: "Cash", value: formatPeso(totals.cash) },
          { label: "Refunded", value: formatPeso(totals.refunded) },
        ]}
      />
      <ContentCard title="Kept per period">
        <BarChart
          bars={report.rows.map((row) => ({
            label: barLabel(row.period, report.period),
            value: row.kept / 100,
          }))}
        />
      </ContentCard>
      <ContentCard title="By period">
        <FiguresTable
          label="Revenue by period"
          head={["Period", "Card", "Cash", "Refunded", "Kept", "Payments"]}
          rows={report.rows.map((row) => ({
            key: row.period,
            cells: [
              periodLabel(row.period, report.period),
              formatPeso(row.card),
              formatPeso(row.cash),
              formatPeso(row.refunded),
              formatPeso(row.kept),
              row.payments,
            ],
          }))}
          total={[
            "Total",
            formatPeso(totals.card),
            formatPeso(totals.cash),
            formatPeso(totals.refunded),
            formatPeso(totals.kept),
            totals.payments,
          ]}
        />
      </ContentCard>
      <ContentCard title="Discounts given">
        {report.discounts.length === 0 ? (
          <EmptyState title="No discounts in this range." />
        ) : (
          <FiguresTable
            label="Discounts given"
            head={["Promotion", "Tests", "Discount"]}
            rows={report.discounts.map((discount) => ({
              key: discount.promotion,
              cells: [discount.promotion, discount.tests, formatPeso(discount.centavos)],
            }))}
          />
        )}
      </ContentCard>
    </div>
  );
}

function BookingsResults({ report }: { report: Of<"bookings"> }) {
  const { totals } = report;
  const counts = (row: Omit<Of<"bookings">["rows"][number], "period">) => [
    row.booked,
    row.confirmed,
    row.rejected,
    row.cancelled,
    row.collected,
    row.notCollected,
    row.returnVisits,
    `${row.collectionRate}%`,
  ];
  return (
    <div className="grid gap-6">
      <Tiles
        items={[
          { label: "Booked", value: String(totals.booked) },
          { label: "Collected", value: String(totals.collected) },
          { label: "Rejected or cancelled", value: String(totals.rejected + totals.cancelled) },
          { label: "Collection rate", value: `${totals.collectionRate}%` },
        ]}
      />
      <ContentCard title="Bookings per period">
        <BarChart
          bars={report.rows.map((row) => ({
            label: barLabel(row.period, report.period),
            value: row.booked,
          }))}
        />
      </ContentCard>
      <ContentCard title="By period">
        <FiguresTable
          label="Bookings by period"
          head={[
            "Booked in",
            "Booked",
            "Confirmed",
            "Rejected",
            "Cancelled",
            "Collected",
            "Not collected",
            "Return visits",
            "Collection rate",
          ]}
          rows={report.rows.map((row) => ({
            key: row.period,
            cells: [periodLabel(row.period, report.period), ...counts(row)],
          }))}
          total={["Total", ...counts(totals)]}
        />
      </ContentCard>
      <ContentCard title="Why visits didn't go ahead">
        {report.topReasons.length === 0 ? (
          <EmptyState title="No rejections or cancellations in this range." />
        ) : (
          <FiguresTable
            label="Top reasons"
            head={["Reason", "Visits"]}
            rows={report.topReasons.map((reason) => ({
              key: reason.reason,
              cells: [reason.reason, reason.count],
            }))}
          />
        )}
      </ContentCard>
    </div>
  );
}

function TestsResults({ report }: { report: Of<"tests"> }) {
  const { totals } = report;
  return (
    <div className="grid gap-6">
      <Tiles
        items={[
          { label: "Tests ordered", value: String(totals.ordered) },
          { label: "Collected", value: String(totals.collected) },
          { label: "Different tests", value: String(report.rows.length) },
          { label: "Revenue", value: formatPeso(totals.revenueCentavos) },
        ]}
      />
      <ContentCard title="By test">
        {report.rows.length === 0 ? (
          <EmptyState title="No tests ordered in this range." />
        ) : (
          <FiguresTable
            label="Tests"
            head={["Test", "Category", "Ordered", "Collected", "Revenue"]}
            rows={report.rows.map((row) => ({
              key: row.code,
              cells: [
                <>
                  <span className="font-medium">{row.name}</span>{" "}
                  <span className="text-muted-foreground">({row.code})</span>
                </>,
                row.category,
                row.ordered,
                row.collected,
                formatPeso(row.revenueCentavos),
              ],
            }))}
            total={[
              "Total",
              "",
              totals.ordered,
              totals.collected,
              formatPeso(totals.revenueCentavos),
            ]}
          />
        )}
      </ContentCard>
      {report.categories.length > 0 && (
        <ContentCard title="By category">
          <FiguresTable
            label="Categories"
            head={["Category", "Ordered", "Collected", "Revenue"]}
            rows={report.categories.map((category) => ({
              key: category.category,
              cells: [
                category.category,
                category.ordered,
                category.collected,
                formatPeso(category.revenueCentavos),
              ],
            }))}
          />
        </ContentCard>
      )}
    </div>
  );
}
