import { useId } from "react";

interface LineChartProps {
  values: number[];
  /** Point that gets the marker and tooltip. Defaults to the highest value. */
  highlight?: number;
  tooltipTitle: string;
  tooltipValue: string;
}

const WIDTH = 300;
const HEIGHT = 120;
const PAD = 10;

/** Smooth line with a soft area fill and one highlighted point, like a trend sparkline. */
export function LineChart({ values, highlight, tooltipTitle, tooltipValue }: LineChartProps) {
  const gradientId = useId();
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((value, i) => ({
    x: PAD + (i / Math.max(values.length - 1, 1)) * (WIDTH - PAD * 2),
    y: PAD + (1 - (value - min) / range) * (HEIGHT - PAD * 2),
  }));

  // Catmull-Rom → cubic Bézier for a smooth curve through every point.
  const line = points
    .map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const p0 = points[i - 2] ?? points[i - 1]!;
      const p1 = points[i - 1]!;
      const p3 = points[i + 1] ?? p;
      const c1 = { x: p1.x + (p.x - p0.x) / 6, y: p1.y + (p.y - p0.y) / 6 };
      const c2 = { x: p.x - (p3.x - p1.x) / 6, y: p.y - (p3.y - p1.y) / 6 };
      return `C${c1.x},${c1.y} ${c2.x},${c2.y} ${p.x},${p.y}`;
    })
    .join(" ");
  const area = `${line} L${points.at(-1)!.x},${HEIGHT} L${points[0]!.x},${HEIGHT} Z`;

  const index = highlight ?? values.indexOf(max);
  const marker = points[index]!;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-300)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-brand-300)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-700 shadow"
        style={{ left: `${(marker.x / WIDTH) * 100}%`, top: `${(marker.y / HEIGHT) * 100}%` }}
      />
      <div
        className="absolute -translate-x-1/2 rounded-lg bg-brand-600 px-2.5 py-1 text-center text-[11px] leading-tight text-white shadow-md"
        style={{
          left: `${Math.min(Math.max((marker.x / WIDTH) * 100, 18), 82)}%`,
          top: `calc(${(marker.y / HEIGHT) * 100}% - 3rem)`,
        }}
      >
        <div className="opacity-80">{tooltipTitle}</div>
        <div className="font-semibold">{tooltipValue}</div>
      </div>
    </div>
  );
}
