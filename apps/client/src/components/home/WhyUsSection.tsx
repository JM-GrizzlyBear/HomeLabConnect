import { reasons } from "./homeContent";
import { SectionLabel } from "./SectionLabel";

/** Why book a home visit: the pitch on the left, four reasons on the right. */
export function WhyUsSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[2fr_3fr] lg:items-center">
        <div>
          <SectionLabel>Why HomeLabConnect</SectionLabel>
          <h2 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl">
            The lab comes to you. Everything else is online.
          </h2>
          <p className="mt-4 text-slate-600">
            No waiting rooms or lines. Book, pay and see your results from your phone, and know
            exactly where your visit stands.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {reasons.map((reason) => (
            <li key={reason.title} className="flex gap-4 rounded-2xl p-5 ring-1 ring-slate-100">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <reason.icon className="size-5" />
              </span>
              <span>
                <h3 className="font-semibold">{reason.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{reason.text}</p>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
