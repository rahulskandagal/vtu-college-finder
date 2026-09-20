import Link from "next/link";
import { DISCLAIMER, OFFICIAL_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-base font-semibold">VTU College Finder</p>
            <p className="mt-2 max-w-md text-sm text-muted">
              An independent research tool for Karnataka engineering aspirants. Not affiliated with KEA, VTU or any college.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-600">{DISCLAIMER}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Explore</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              <li><Link href="/find" className="hover:text-primary">Find colleges by rank</Link></li>
              <li><Link href="/cutoffs" className="hover:text-primary">KCET cutoff explorer</Link></li>
              <li><Link href="/branches" className="hover:text-primary">Branches</Link></li>
              <li><Link href="/compare" className="hover:text-primary">Compare colleges</Link></li>
              <li><Link href="/compare/branches" className="hover:text-primary">Compare branches</Link></li>
              <li><Link href="/kcet-guide" className="hover:text-primary">KCET counselling guide</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Official sources</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {OFFICIAL_LINKS.slice(0, 4).map((l) => (
                <li key={l.label}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-border pt-4 text-xs text-muted">
          © {new Date().getFullYear()} VTU College Finder. Data attribution shown per record. Report corrections via the admin dashboard.
        </p>
      </div>
    </footer>
  );
}
