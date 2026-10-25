import { cn } from "@/lib/utils";
import { steps } from "./homeContent";
import { SectionLabel } from "./SectionLabel";

/** The four steps from booking to results. The last one spans the row. */
export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
          From booking to results, without leaving home
        </h2>
        <ol className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={cn(
                "rounded-2xl bg-brand-50/70 p-6",
                index === steps.length - 1 && "sm:col-span-2 lg:col-span-3",
              )}
            >
              <div className="flex items-start justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <step.icon className="size-5" />
                </span>
                <span aria-hidden className="text-2xl font-extrabold text-brand-200">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
