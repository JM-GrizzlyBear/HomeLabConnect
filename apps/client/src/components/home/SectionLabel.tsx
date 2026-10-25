/** The small green caps above a section's heading, e.g. "HOW IT WORKS". */
export function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-[0.18em] text-brand-600 uppercase">{children}</p>
  );
}
