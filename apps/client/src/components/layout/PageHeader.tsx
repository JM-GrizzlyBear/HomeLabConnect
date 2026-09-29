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

/** The small rounded action button in the header's top-right, e.g. "Contact support". */
export const pillActionClass =
  "rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold tracking-wide text-white uppercase shadow-md shadow-brand-600/25 transition hover:bg-brand-700";
