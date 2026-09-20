import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, humanize } from "@/lib/utils";
import { Badge, Container, DemoBadge, EmptyState, PageHeader } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";

export const metadata: Metadata = { title: "Events", description: "Technical fests, cultural fests, workshops, seminars and competitions across VTU engineering colleges." };
export const dynamic = "force-dynamic";

const TYPES = ["TECHNICAL_FEST", "CULTURAL_FEST", "SPORTS", "WORKSHOP", "SEMINAR", "CONFERENCE", "HACKATHON", "CODING_COMPETITION", "STUDENT_ACTIVITY", "OTHER"] as const;

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ type?: string; year?: string; college?: string }> }) {
  const { type, year, college } = await searchParams;
  const [events, years, colleges] = await Promise.all([
    prisma.event.findMany({
      where: {
        ...(type && TYPES.includes(type as (typeof TYPES)[number]) ? { type: type as (typeof TYPES)[number] } : {}),
        ...(year ? { year: Number(year) } : {}),
        ...(college ? { college: { slug: college } } : {}),
      },
      orderBy: [{ year: "desc" }, { date: "desc" }],
      take: 200,
      include: { college: { select: { slug: true, name: true, shortName: true, city: true } }, department: { select: { name: true } } },
    }),
    prisma.event.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "desc" } }),
    prisma.college.findMany({ select: { slug: true, shortName: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <Container className="py-8">
      <PageHeader title="Events" description="Fests, workshops, seminars, conferences and competitions recorded for each college.">
        <div className="flex flex-wrap gap-2">
          <AutoSubmitSelect param="type" defaultValue={type ?? ""} className="w-44" aria-label="Event type">
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {humanize(t)}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect param="year" defaultValue={year ?? ""} className="w-28" aria-label="Year">
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y.year} value={y.year}>
                {y.year}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect param="college" defaultValue={college ?? ""} className="w-48" aria-label="College">
            <option value="">All colleges</option>
            {colleges.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.shortName ?? c.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
      </PageHeader>
      {events.length === 0 ? (
        <EmptyState title="No events recorded for these filters" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <article key={e.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <Badge tone={e.type === "TECHNICAL_FEST" ? "primary" : e.type === "CULTURAL_FEST" ? "accent" : "neutral"}>{humanize(e.type)}</Badge>
                {e.isDemo && <DemoBadge />}
              </div>
              <h3 className="mt-2 font-semibold">{e.name}</h3>
              <p className="text-xs text-muted">
                <Link href={`/college/${e.college.slug}?tab=events`} className="hover:text-primary">
                  {e.college.shortName ?? e.college.name}
                </Link>{" "}
                · {e.college.city} · {e.date ? formatDate(e.date) : e.year}
                {e.department && <> · {e.department.name}</>}
              </p>
              {e.description && <p className="mt-2 line-clamp-3 text-sm text-slate-700">{e.description}</p>}
              {e.participants != null && <p className="mt-2 text-xs text-muted">{e.participants.toLocaleString("en-IN")} participants</p>}
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}
