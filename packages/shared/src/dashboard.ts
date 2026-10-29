import { z } from "zod";

/** A slice of a donut chart; the page picks its colour by position. */
const segmentSchema = z.object({ label: z.string(), value: z.number() });
const donutSchema = z.object({
  title: z.string(),
  segments: z.array(segmentSchema),
  centerValue: z.string(),
  centerLabel: z.string(),
});

/** The five cards of a role's dashboard, every number real. */
export const dashboardSchema = z.object({
  stats: z.object({
    title: z.string(),
    items: z.array(z.object({ label: z.string(), value: z.string() })),
  }),
  donut: donutSchema,
  trend: z.object({
    title: z.string(),
    /** Oldest first. */
    values: z.array(z.number()),
    tooltipTitle: z.string(),
    tooltipValue: z.string(),
  }),
  bars: z.object({
    title: z.string(),
    headline: z.string(),
    caption: z.string(),
    bars: z.array(z.object({ label: z.string(), value: z.number() })),
    ring: z.object({ percent: z.number(), label: z.string() }),
  }),
  breakdown: donutSchema,
});

export type Dashboard = z.infer<typeof dashboardSchema>;
