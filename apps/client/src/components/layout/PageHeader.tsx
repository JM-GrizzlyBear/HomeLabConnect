import type { ReactNode } from "react";

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-xl font-semibold tracking-wide text-brand-600 uppercase sm:text-2xl">
        {title}
      </h1>
      {action}
    </div>
  );
}
