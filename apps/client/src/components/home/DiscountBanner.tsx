import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useHomeLinks } from "./useHomeLinks";

/** The standing 20% senior & PWD discount. */
export function DiscountBanner() {
  const { bookPath } = useHomeLinks();

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 rounded-3xl bg-brand-50/80 p-6 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:p-8">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-brand-600 font-bold text-white">
          20%
        </span>
        <div className="flex-1">
          <h2 className="text-lg font-bold sm:text-xl">
            20% off every test for seniors and persons with disability
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Applied to every test, every visit. No end date.
          </p>
        </div>
        <Button asChild>
          <Link to={bookPath}>Book with the discount</Link>
        </Button>
      </div>
    </section>
  );
}
