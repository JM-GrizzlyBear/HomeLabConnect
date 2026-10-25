import { Link } from "react-router";
import { LogoMark } from "@/components/icons";
import { sectionLinks } from "./homeContent";

/** The homepage footer: the brand, section links, staff sign-in and the year. */
export function HomeFooter() {
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
          {sectionLinks.map((section) => (
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
