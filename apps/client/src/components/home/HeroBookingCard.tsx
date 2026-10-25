import { DropletIcon, FileCheckIcon, TestTubeIcon } from "lucide-react";

const sampleLines = [
  { name: "Complete Blood Count", price: "₱350" },
  { name: "Lipid Panel", price: "₱900" },
];

/** A sample booking card in the hero, showing patients what they'll see after booking. */
export function HeroBookingCard() {
  return (
    <figure
      aria-label="Example booking"
      className="relative mx-auto w-full max-w-md rounded-3xl bg-linear-to-br from-brand-500 to-brand-700 p-5 shadow-2xl shadow-brand-900/20 sm:p-8"
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
          {sampleLines.map((line) => (
            <div key={line.name} className="flex justify-between">
              <dt>{line.name}</dt>
              <dd className="font-semibold">{line.price}</dd>
            </div>
          ))}
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
