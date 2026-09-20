import Link from "next/link";
import { ArrowRight, BarChart3, GitCompare, GraduationCap, Search, Sparkles, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getHomeStats } from "@/lib/data/search";
import { listColleges } from "@/lib/data/colleges";
import { RankForm } from "@/components/college/rank-form";
import { CollegeCard } from "@/components/college/college-card";
import { Container, Disclaimer, LinkButton, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const FEATURES = [
  { href: "/colleges", icon: Search, title: "Search colleges", text: "By name, KEA code, district, city or branch — with fee, hostel and placement filters." },
  { href: "/compare", icon: GitCompare, title: "Compare colleges", text: "Cutoffs, fees, placements, labs, hostels and clubs side by side for up to four colleges." },
  { href: "/cutoffs", icon: BarChart3, title: "Explore KCET cutoffs", text: "Ten years of opening and closing ranks by branch, category and counselling round." },
  { href: "/branches", icon: GraduationCap, title: "Explore branches", text: "What each branch teaches, career paths, higher-study options and where it is offered." },
  { href: "/campus-life", icon: Users, title: "Explore campus life", text: "Clubs, fests, hackathons, sports and student activities across colleges." },
];

export default async function HomePage() {
  const [stats, branches, featured] = await Promise.all([
    getHomeStats(),
    prisma.branch.findMany({ select: { slug: true, shortName: true, name: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    listColleges({ sort: "cutoff", page: 1, pageSize: 6 }),
  ]);

  return (
    <>
      <section className="bg-gradient-to-b from-blue-50 to-background">
        <Container className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Karnataka · KCET · VTU-affiliated engineering colleges
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Find the right engineering college for your KCET rank</h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              Explore colleges, branches, historical cutoffs, fees, placements, campus facilities and student life — all in one place.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-4xl">
            <RankForm branches={branches} compact />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm">
              <Link href="/find" className="text-primary hover:underline">
                Use the full preference form
              </Link>
              <span className="text-slate-300">·</span>
              <Link href="/colleges" className="text-primary hover:underline">
                Browse all colleges
              </Link>
            </div>
          </div>
          <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 text-center sm:grid-cols-4">
            {[
              ["Colleges", stats.colleges],
              ["Branches", stats.branches],
              ["Cutoff records", stats.cutoffs.toLocaleString("en-IN")],
              ["Years covered", stats.yearRange ? `${stats.yearRange.from}–${stats.yearRange.to}` : "—"],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg border border-border bg-white/70 px-3 py-3">
                <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
                <dd className="text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <f.icon className="h-6 w-6 text-primary" />
              <p className="mt-3 font-semibold">{f.title}</p>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                Open <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="pb-12">
        <div className="mb-4 flex items-end justify-between">
          <SectionTitle className="mb-0">Colleges with the most competitive GM cutoffs</SectionTitle>
          <LinkButton href="/colleges?sort=cutoff" variant="ghost" size="sm">
            See all <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.items.map((c) => (
            <CollegeCard key={c.id} college={c} />
          ))}
        </div>
      </Container>

      <Container className="pb-12">
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="text-xl font-semibold">How the rank finder works</h2>
          <ol className="mt-4 grid gap-4 text-sm text-slate-700 sm:grid-cols-4">
            {[
              ["Enter your KCET rank, category and preferences.", "Branch, district, college type, fee budget and hostel."],
              ["We look up historical closing ranks.", "Final-round closing ranks for the last three years, for your category (falling back to GM)."],
              ["Colleges are grouped, not scored.", "Likely available · Possible · Competitive · Historically unlikely — with the data behind each."],
              ["You research and decide.", "Open a college profile for cutoffs, fees, placements, faculty, labs, hostels, clubs and events."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-lg bg-slate-50 p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{i + 1}</span>
                <p className="mt-2 font-medium">{t}</p>
                <p className="mt-1 text-xs text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <Disclaimer className="mt-6" />
        </div>
      </Container>
    </>
  );
}
