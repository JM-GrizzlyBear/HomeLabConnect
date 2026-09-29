export interface Bar {
  label: string;
  value: number;
}

// Alternating greens give the reference's multi-colour rhythm while staying on brand.
const barColors = [
  "bg-brand-300",
  "bg-brand-500",
  "bg-brand-400",
  "bg-brand-700",
  "bg-brand-200",
  "bg-brand-600",
  "bg-brand-800",
];

export function BarChart({ bars, height = 120 }: { bars: Bar[]; height?: number }) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {bars.map((bar, i) => (
          <div
            key={`${bar.label}-${i}`}
            title={`${bar.label}: ${bar.value}`}
            className={`flex-1 rounded-t-md ${barColors[i % barColors.length]}`}
            style={{ height: `${Math.max((bar.value / max) * 100, 4)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {bars.map((bar, i) => (
          <span key={`${bar.label}-${i}`} className="flex-1 text-center text-[10px] text-slate-400">
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}
