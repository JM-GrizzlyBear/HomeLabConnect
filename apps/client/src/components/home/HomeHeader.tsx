import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { LogoMark } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { sectionLinks } from "./homeContent";
import { useHomeLinks } from "./useHomeLinks";

/** The homepage's top bar: logo, section links, and sign in / book (a menu on phones). */
export function HomeHeader() {
  const { signedIn, bookPath } = useHomeLinks();
  const [open, setOpen] = useState(false);

  const actions = (
    <>
      {signedIn ? (
        <Button asChild variant="ghost" className="font-semibold text-brand-700">
          <Link to="/app">My account</Link>
        </Button>
      ) : (
        <Button asChild variant="ghost" className="font-semibold text-brand-700">
          <Link to="/login">Sign in</Link>
        </Button>
      )}
      <Button asChild className="shadow-md shadow-brand-600/20">
        <Link to={bookPath}>Book a home visit</Link>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
          <LogoMark className="size-8" />
          HomeLabConnect
        </Link>

        <nav
          aria-label="Sections"
          className="hidden items-center gap-7 text-sm text-slate-600 md:flex"
        >
          {sectionLinks.map((section) => (
            <a key={section.href} href={section.href} className="hover:text-brand-700">
              {section.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">{actions}</div>

        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>HomeLabConnect</SheetTitle>
            <SheetDescription>Lab tests at home. Results online.</SheetDescription>
          </SheetHeader>
          <nav aria-label="Sections" className="grid gap-1 px-4">
            {sectionLinks.map((section) => (
              <a
                key={section.href}
                href={section.href}
                className="rounded-md px-2 py-2 text-slate-700 hover:bg-brand-50"
                onClick={() => setOpen(false)}
              >
                {section.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 grid gap-2 px-4">{actions}</div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
