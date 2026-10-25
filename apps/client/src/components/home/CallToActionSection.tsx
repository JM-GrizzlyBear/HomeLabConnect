import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useHomeLinks } from "./useHomeLinks";

const onGreen = "bg-white text-brand-800 hover:bg-brand-50";

/** The closing call to action: sign up or sign in (or book, when signed in). */
export function CallToActionSection() {
  const { signedIn, bookPath } = useHomeLinks();

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-linear-to-br from-brand-500 to-brand-700 px-6 py-12 text-center text-white sm:py-16">
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
              <Button asChild size="lg" variant="secondary" className={onGreen}>
                <Link to={bookPath}>Book a home visit</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" variant="secondary" className={onGreen}>
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
