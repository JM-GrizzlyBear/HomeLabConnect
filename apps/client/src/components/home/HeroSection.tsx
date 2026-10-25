import { ArrowRightIcon, ClockIcon, CreditCardIcon, HouseIcon, TagIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { HeroBookingCard } from "./HeroBookingCard";
import { useHomeLinks } from "./useHomeLinks";

const highlights = [
  { icon: ClockIcon, text: "Morning visits, every day" },
  { icon: CreditCardIcon, text: "Pay by card or cash" },
  { icon: TagIcon, text: "20% off for seniors & PWD" },
];

/** The first screen: what the service is, the two main actions, and a sample booking. */
export function HeroSection() {
  const { bookPath } = useHomeLinks();

  return (
    <section className="relative overflow-hidden bg-brand-50/70">
      {/* Decorative circles, as in the design */}
      <div
        aria-hidden
        className="absolute -top-24 -left-24 size-56 rounded-full bg-linear-to-br from-brand-400 to-brand-600 opacity-80"
      />
      <div
        aria-hidden
        className="absolute -bottom-16 left-1/2 hidden size-40 rounded-full bg-white lg:block"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
            <HouseIcon className="size-3.5 text-brand-600" />
            Home laboratory service
          </p>
          <h1 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            Lab tests at home.
            <span className="block text-brand-600">Results online.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
            Book your tests online and a medical team comes to your home to collect your sample. A
            doctor reviews it and releases your results straight to your account.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-lg shadow-brand-600/25">
              <Link to={bookPath}>
                Book a home visit
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-brand-200 bg-white">
              <a href="#tests">See tests & prices</a>
            </Button>
          </div>
          <ul className="mt-7 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 sm:gap-x-6">
            {highlights.map((highlight) => (
              <li key={highlight.text} className="flex items-center gap-2">
                <highlight.icon className="size-4 text-brand-600" />
                {highlight.text}
              </li>
            ))}
          </ul>
        </div>

        <HeroBookingCard />
      </div>
    </section>
  );
}
