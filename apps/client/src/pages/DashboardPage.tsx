import { Link } from "react-router";
import { useAuth } from "../auth/authContext";
import { ContentCard } from "../components/layout/ContentCard";
import { BarChart } from "../components/charts/BarChart";
import { DonutChart, DonutLegend, ProgressRing } from "../components/charts/DonutChart";
import { LineChart } from "../components/charts/LineChart";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../components/layout/PageHeader";
import { sampleDashboards } from "./dashboard/sampleData";

/** Home page after sign-in: a card grid tailored to the user's role. */
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  const data = sampleDashboards[user.role];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        action={
          user.role === "patient" ? (
            <Button asChild>
              <Link to="/app/support/tickets">Contact support</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ContentCard title={data.stats.title} sample>
          <dl className="grid grid-cols-2 gap-3">
            {data.stats.items.map((item) => (
              <div key={item.label} className="rounded-xl bg-brand-50 px-3 py-3">
                <dt className="text-[11px] font-medium text-brand-800/70">{item.label}</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </ContentCard>

        <ContentCard title={data.donut.title} sample>
          <div className="flex items-center gap-6">
            <DonutChart
              size={130}
              segments={data.donut.segments}
              centerValue={data.donut.centerValue}
              centerLabel={data.donut.centerLabel}
            />
            <div className="min-w-0 flex-1">
              <DonutLegend segments={data.donut.segments} />
            </div>
          </div>
        </ContentCard>

        <ContentCard title={data.trend.title} sample className="md:col-span-2 xl:col-span-1">
          <div className="pt-8">
            <LineChart
              values={data.trend.values}
              tooltipTitle={data.trend.tooltipTitle}
              tooltipValue={data.trend.tooltipValue}
            />
          </div>
        </ContentCard>

        <ContentCard title={data.bars.title} sample className="md:col-span-2">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="mb-5 flex items-baseline gap-3">
                <span className="text-3xl font-semibold text-slate-900">{data.bars.headline}</span>
                <span className="text-sm text-slate-500">{data.bars.caption}</span>
              </p>
              <BarChart bars={data.bars.bars} />
            </div>
            <div className="flex justify-center">
              <ProgressRing percent={data.bars.ring.percent} label={data.bars.ring.label} />
            </div>
          </div>
        </ContentCard>

        <ContentCard title={data.breakdown.title} sample>
          <div className="flex flex-col items-center gap-5">
            <DonutChart
              size={160}
              thickness={22}
              segments={data.breakdown.segments}
              centerValue={data.breakdown.centerValue}
              centerLabel={data.breakdown.centerLabel}
            />
            <div className="w-full">
              <DonutLegend segments={data.breakdown.segments} />
            </div>
          </div>
        </ContentCard>
      </div>
    </>
  );
}
