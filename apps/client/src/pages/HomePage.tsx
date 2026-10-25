import {
  ArrowRightIcon,
  ClockIcon,
  CreditCardIcon,
  DropletIcon,
  FileCheckIcon,
  HouseIcon,
  PlusIcon,
  TagIcon,
  TestTubeIcon,
} from "lucide-react";
import { Link } from "react-router";
import { faqs, popularTests, reasons, steps } from "@/components/home/homeContent";
import { HomeHeader, sections } from "@/components/home/HomeHeader";
import { LogoMark } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/authContext";

/** The public homepage: what the service is, how it works, prices and answers, then sign up. */
export function HomePage() {
  const { status } = useAuth();
  const signedIn = status === "signedIn";
  // Guests create an account first; signed-in patients go straight to booking
  const bookPath = signedIn ? "/app/appointments/book" : "/register";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <HomeHeader signedIn={signedIn} bookPath={bookPath} />
      <main>
        <Hero bookPath={bookPath} />
        <HowItWorks />
        <PopularTests bookPath={bookPath} />
        <DiscountBanner bookPath={bookPath} />
        <WhyUs />
        <Faq />
        <CallToAction signedIn={signedIn} bookPath={bookPath} />
      </main>
      <Footer />
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-[0.18em] text-brand-600 uppercase">{children}</p>
  );
}

function Hero({ bookPath }: { bookPath: string }) {
  return (
    <section className="relative overflow-hidden bg-brand-50/70">
      {/* Decorative circles, as in the design */}
      <div
        aria-hidden
        className="absolute -top-24 -left-24 size-56 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 opacity-80"
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
            <li className="flex items-center gap-2">
              <ClockIcon className="size-4 text-brand-600" />
              Morning visits, every day
            </li>
            <li className="flex items-center gap-2">
              <CreditCardIcon className="size-4 text-brand-600" />
              Pay by card or cash
            </li>
            <li className="flex items-center gap-2">
              <TagIcon className="size-4 text-brand-600" />
              20% off for seniors & PWD
            </li>
          </ul>
        </div>

        <HeroCard />
      </div>
    </section>
  );
}

/** A sample booking, to show what patients see. */
function HeroCard() {
  return (
    <figure
      aria-label="Example booking"
      className="relative mx-auto w-full max-w-md rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 shadow-2xl shadow-brand-900/20 sm:p-8"
    >
      <span
        aria-hidden
        className="absolute top-1/2 -left-6 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-600 shadow-lg sm:flex"
      >
        <TestTubeIcon className="size-5" />
      </span>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Home visit
            </p>
            <p className="mt-0.5 font-bold">Tue, Nov 3 · 8:00 AM</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            <span className="size-1.5 rounded-full bg-brand-600" />
            Accepted
          </span>
        </div>
        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Complete Blood Count</dt>
            <dd className="font-semibold">₱350</dd>
          </div>
          <div className="flex justify-between">
            <dt>Lipid Panel</dt>
            <dd className="font-semibold">₱900</dd>
          </div>
          <div className="flex justify-between text-brand-700">
            <dt>Senior & PWD discount (20%)</dt>
            <dd className="font-semibold">−₱250</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-500">Total · pay online or cash</span>
          <span className="text-2xl font-extrabold">₱1,000</span>
        </div>
        <p className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <DropletIcon className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          Lipid Panel: fast before the visit. Water is allowed.
        </p>
      </div>
      <div className="mt-4 ml-auto flex w-fit items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-lg sm:-mr-10">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <FileCheckIcon className="size-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Your results are ready</span>
          <span className="block text-xs text-slate-500">Released by your doctor</span>
        </span>
      </div>
    </figure>
  );
}

function HowItWorks() {
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
              className={`rounded-2xl bg-brand-50/70 p-6 ${index === steps.length - 1 ? "sm:col-span-2 lg:col-span-3" : ""}`}
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

function PopularTests({ bookPath }: { bookPath: string }) {
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
            <li
              key={test.name}
              className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
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
          ))}
        </ul>
      </div>
    </section>
  );
}

function DiscountBanner({ bookPath }: { bookPath: string }) {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 rounded-3xl bg-brand-50/80 p-6 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:p-8">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">
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

function WhyUs() {
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

function Faq() {
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

function CallToAction({ signedIn, bookPath }: { signedIn: boolean; bookPath: string }) {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-12 text-center text-white sm:py-16">
        {/* Soft waves, as in the design */}
        <svg
          aria-hidden
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full opacity-15"
        >
          <path d="M0 40 C200 0 400 80 800 30" stroke="white" strokeWidth="14" fill="none" />
          <path d="M0 170 C250 120 500 210 800 150" stroke="white" strokeWidth="14" fill="none" />
        </svg>
        <div className="relative">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Skip the lab line.</h2>
          <p className="mx-auto mt-3 max-w-md text-brand-50">
            Book your home visit in a few minutes. Your results come to you, too.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {signedIn ? (
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-brand-800 hover:bg-brand-50"
              >
                <Link to={bookPath}>Book a home visit</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-brand-800 hover:bg-brand-50"
                >
                  <Link to="/register">Create an account</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/login">I already have one · Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2.5 font-semibold text-white">
            <LogoMark className="size-7" />
            HomeLabConnect
          </p>
          <p className="mt-1 text-sm">Home laboratory service platform</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {sections.map((section) => (
            <a key={section.href} href={section.href} className="hover:text-white">
              {section.label}
            </a>
          ))}
          <Link to="/login" className="hover:text-white">
            Staff sign in
          </Link>
        </nav>
        <p className="text-sm text-brand-200">© {new Date().getFullYear()} HomeLabConnect</p>
      </div>
    </footer>
  );
}
