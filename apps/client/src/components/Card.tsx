import type { ReactNode } from "react";

interface CardProps {
  title: string;
  /** Marks cards that still show made-up numbers. */
  sample?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ title, sample = false, className = "", children }: CardProps) {
  return (
    <section className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-medium text-slate-800">{title}</h2>
        {sample && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-700 uppercase ring-1 ring-amber-200">
            Sample data
          </span>
        )}
      </header>
      {children}
    </section>
  );
}
