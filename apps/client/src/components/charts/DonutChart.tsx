export interface DonutSegment {
  label: string;
  value: number;
  /** Any CSS colour; use theme variables, e.g. "var(--color-brand-500)". */
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
}

/** Ring split into segments, drawn clockwise from 12 o'clock with small gaps. */
export function DonutChart({
  segments,
  size = 150,
  thickness = 18,
  centerValue,
  centerLabel,
}: DonutChartProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const gap = segments.length > 1 ? 4 : 0;

  const lengths = segments.map((segment) => (segment.value / total) * circumference);
  const arcs = segments.map((segment, i) => ({
    ...segment,
    length: Math.max(lengths[i]! - gap, 0),
    // Each arc starts where all the previous ones ended.
    offset: lengths.slice(0, i).reduce((sum, length) => sum + length, 0),
  }));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-brand-50)"
          strokeWidth={thickness}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${arc.length} ${circumference}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
      </svg>
      {(centerValue || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && (
            <span className="text-xl font-semibold text-slate-900">{centerValue}</span>
          )}
          {centerLabel && <span className="text-xs text-slate-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function DonutLegend({ segments }: { segments: DonutSegment[] }) {
  return (
    <ul className="space-y-2.5 text-sm text-slate-600">
      {segments.map((segment) => (
        <li key={segment.label} className="flex items-center gap-2.5">
          <span className="size-3 rounded-sm" style={{ backgroundColor: segment.color }} />
          <span className="flex-1">{segment.label}</span>
          <span className="font-medium text-slate-900">{segment.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** A single-value ring, e.g. a completion percentage. */
export function ProgressRing({
  percent,
  label,
  size = 140,
}: {
  percent: number;
  label: string;
  size?: number;
}) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return (
    <DonutChart
      size={size}
      thickness={14}
      centerValue={`${clamped}%`}
      centerLabel={label}
      segments={[{ label, value: clamped, color: "var(--color-brand-500)" }].concat(
        clamped < 100
          ? [{ label: "rest", value: 100 - clamped, color: "var(--color-brand-100)" }]
          : [],
      )}
    />
  );
}
