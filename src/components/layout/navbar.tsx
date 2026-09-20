"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { GraduationCap, Menu, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui";
import type { SessionUser } from "@/lib/auth/session-edge";

const MAIN_LINKS = [
  { href: "/find", label: "Find Colleges" },
  { href: "/cutoffs", label: "KCET Cutoffs" },
  { href: "/branches", label: "Branches" },
  { href: "/compare", label: "Compare" },
  { href: "/colleges", label: "College Directory" },
];

const MORE_LINKS = [
  { href: "/campus-life", label: "Campus Life" },
  { href: "/placements", label: "Placements" },
  { href: "/events", label: "Events" },
  { href: "/hackathons", label: "Hackathons" },
  { href: "/clubs", label: "Clubs" },
  { href: "/kcet-guide", label: "KCET Guide" },
];

export function Navbar({ session }: { session: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [q, setQ] = useState("");

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/colleges?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden whitespace-nowrap sm:inline">VTU College Finder</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {MAIN_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100", isActive(l.href) ? "text-primary" : "text-slate-700")}
            >
              {l.label}
            </Link>
          ))}
          <div className="relative" onMouseLeave={() => setMore(false)}>
            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className={cn("flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100", MORE_LINKS.some((l) => isActive(l.href)) ? "text-primary" : "text-slate-700")}
            >
              More <ChevronDown className="h-4 w-4" />
            </button>
            {more && (
              <div className="absolute left-0 top-full w-48 rounded-lg border border-border bg-white p-1 shadow-lg">
                {MORE_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMore(false)} className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search college, code, city…"
              className="h-9 w-56 rounded-lg border border-border bg-slate-50 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 xl:w-72"
              aria-label="Search colleges"
            />
          </div>
        </form>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Link href={session.role === "ADMIN" ? "/admin" : "/dashboard"} className={buttonClass("outline", "sm")}>
                {session.role === "ADMIN" ? "Admin Dashboard" : "My Dashboard"}
              </Link>
              <button onClick={logout} className={buttonClass("ghost", "sm")}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost", "sm")}>
                Log in
              </Link>
              <Link href="/register" className={buttonClass("primary", "sm")}>
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto rounded-md p-2 hover:bg-slate-100 lg:hidden md:ml-0"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white px-4 py-4 lg:hidden">
          <form onSubmit={submitSearch} className="mb-3 md:hidden">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search college, code, city…"
              className="h-10 w-full rounded-lg border border-border bg-slate-50 px-3 text-sm"
              aria-label="Search colleges"
            />
          </form>
          <div className="grid grid-cols-2 gap-1">
            {[...MAIN_LINKS, ...MORE_LINKS].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn("rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100", isActive(l.href) ? "text-primary" : "text-slate-700")}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-border pt-3 md:hidden">
            {session ? (
              <>
                <Link href={session.role === "ADMIN" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className={buttonClass("outline", "sm", "flex-1")}>
                  {session.role === "ADMIN" ? "Admin" : "My Dashboard"}
                </Link>
                <button onClick={logout} className={buttonClass("ghost", "sm", "flex-1")}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className={buttonClass("outline", "sm", "flex-1")}>
                  Log in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className={buttonClass("primary", "sm", "flex-1")}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
