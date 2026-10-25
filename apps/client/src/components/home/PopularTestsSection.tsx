import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { type PopularTest, popularTests } from "./homeContent";
import { SectionLabel } from "./SectionLabel";
import { useHomeLinks } from "./useHomeLinks";

/** A few common tests with their prices, each with a Book button. */
export function PopularTestsSection() {
  const { bookPath } = useHomeLinks();

  return (
    <section id="tests" className="scroll-mt-20 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionLabel>Tests & prices</SectionLabel>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Popular tests</h2>
            <p className="mt-2 text-slate-600">
              Clear prices, shown before you book. The home visit is part of the service.
            </p>
          </div>
          <Link
            to={bookPath}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
          >
            See all tests
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularTests.map((test) => (
            <TestCard key={test.name} test={test} bookPath={bookPath} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function TestCard({ test, bookPath }: { test: PopularTest; bookPath: string }) {
  return (
    <li className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-800">
          {test.category}
        </span>
        <span className="text-slate-500">{test.note}</span>
      </div>
      <h3 className="mt-3 font-semibold">{test.name}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600">{test.description}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xl font-extrabold">{test.price}</span>
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="bg-brand-50 text-brand-700 hover:bg-brand-100"
        >
          <Link to={bookPath} aria-label={`Book ${test.name}`}>
            Book
          </Link>
        </Button>
      </div>
    </li>
  );
}
