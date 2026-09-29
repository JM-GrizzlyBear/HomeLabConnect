import type { ReactNode } from "react";
import { Link } from "react-router";
import { LogoMark, TestTubeIcon } from "./icons";

// TODO: replace the placeholder hero image with the real photo/illustration.
const HERO_IMAGE = "/images/auth-hero-placeholder.svg";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

/** Floating split card shared by the sign-in and registration pages. */
export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-50 px-4 py-10 sm:px-8">
      <div className="relative w-full max-w-5xl">
        {/* Decorative circles peeking out from behind the card */}
        <div
          aria-hidden
          className="absolute -top-8 -left-8 size-28 rounded-full bg-linear-to-br from-brand-400 to-brand-600 sm:-top-10 sm:-left-10 sm:size-32"
        />
        <div
          aria-hidden
          className="absolute -right-8 -bottom-10 size-28 rounded-full bg-white shadow-lg shadow-brand-900/5 sm:size-32"
        />

        <div className="relative grid overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-900/10 md:grid-cols-2">
          {/* Form side */}
          <section className="flex flex-col px-6 py-8 sm:px-12 sm:py-10">
            <Link to="/" className="flex items-center gap-2 self-start">
              <LogoMark className="size-8" />
              <span className="text-lg font-semibold text-slate-900">HomeLabConnect</span>
            </Link>

            <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-wide text-slate-900 uppercase">
                  {title}
                </h1>
                <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
              </div>
              <div className="mt-8">{children}</div>
              <p className="mt-8 text-center text-sm text-slate-600">{footer}</p>
            </div>
          </section>

          {/* Illustration side */}
          <section
            aria-hidden
            className="relative hidden items-center justify-center overflow-hidden bg-linear-to-br from-brand-500 via-brand-600 to-brand-700 p-12 md:flex"
          >
            <svg
              className="absolute inset-0 size-full"
              viewBox="0 0 600 700"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <g className="stroke-white/10" strokeWidth="28">
                <path d="M-80 120C80 40 220 60 330 150s260 90 360 10" />
                <path d="M-60 560c90-120 230-150 330-90s210 110 380 40" />
                <path d="M470 -40c-70 150-40 300 90 400" />
                <path d="M-40 320c60-40 120-40 170 10" />
              </g>
            </svg>

            <div className="relative w-full max-w-xs">
              <div className="aspect-3/4 overflow-hidden rounded-[2rem] bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
                <img
                  src={HERO_IMAGE}
                  alt=""
                  className="size-full object-contain object-bottom pt-6"
                />
              </div>
              <div className="absolute top-1/2 -left-7 flex size-16 items-center justify-center rounded-full bg-white shadow-lg shadow-brand-900/20">
                <TestTubeIcon className="size-8 text-brand-600" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
