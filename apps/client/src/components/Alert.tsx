import type { ReactNode } from "react";

const tones = {
  error: "bg-rose-50 text-rose-800 ring-rose-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-amber-200",
};

export function Alert({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-4 py-3 text-sm ring-1 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
