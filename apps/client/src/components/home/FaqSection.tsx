import { PlusIcon } from "lucide-react";
import { faqs } from "./homeContent";
import { SectionLabel } from "./SectionLabel";

/**
 * Questions people ask before booking. Each answer opens in place: native <details>, so it
 * works with the keyboard and screen readers without extra code.
 */
export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-brand-50/70 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Good to know before you book</h2>
        </div>
        <div className="mt-8 grid gap-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-xl bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold sm:px-5 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <PlusIcon className="size-4 shrink-0 text-brand-600 transition-transform group-open:rotate-45" />
              </summary>
              <p className="px-4 pb-4 text-sm text-slate-600 sm:px-5">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
