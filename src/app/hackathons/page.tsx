import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Container, DemoBadge, EmptyState, PageHeader, Stat } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";

export const metadata: Metadata = { title: "Hackathons", description: "Hackathons and coding competitions hosted by VTU engineering colleges — participants, winners, projects and sponsors." };
export const dynamic = "force-dynamic";

export default async function HackathonsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year } = await searchParams;
  const [items, years, perCollege] = await Promise.all([
    prisma.hackathon.findMany({
      where: year ? { year: Number(year) } : {},
      orderBy: [{ year: "desc" }, { name: "asc" }],
      take: 200,
      include: { college: { select: { slug: true, name: true, shortName: true, city: true } } },
    }),
    prisma.hackathon.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "desc" } }),
    prisma.hackathon.groupBy({ by: ["collegeId"], _count: { _all: true }, _sum: { participants: true } }),
  ]);
  const collegeNames = await prisma.college.findMany({ where: { id: { in: perCollege.map((p) => p.collegeId) } }, select: { id: true, slug: true, shortName: true, name: true } });
  const activity = perCollege
    .map((p) => ({ ...p, college: collegeNames.find((c) => c.id === p.collegeId) }))
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 8);

  return (
    <Container className="py-8">
      <PageHeader title="Hackathons" description="How active each college is in hackathons and technical competitions, based on recorded events.">
        <AutoSubmitSelect param="year" defaultValue={year ?? ""} className="w-32" aria-label="Year">
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y.year} value={y.year}>
              {y.year}
            </option>
          ))}
        </AutoSubmitSelect>
      </PageHeader>

      {activity.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {activity.slice(0, 4).map((a) => (
            <Stat key={a.collegeId} label={a.college?.shortName ?? a.college?.name ?? "—"} value={`${a._count._all} hackathons`} hint={a._sum.participants ? `${a._sum.participants.toLocaleString("en-IN")} participants recorded` : undefined} />
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState title="No hackathons recorded" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((h) => (
            <article key={h.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <Badge tone="primary">{h.year}</Badge>
                <div className="flex gap-1">
                  {h.isDemo && <DemoBadge />}
                  {h.participants != null && <Badge>{h.participants} participants</Badge>}
                </div>
              </div>
              <h3 className="mt-2 font-semibold">{h.name}</h3>
              <p className="text-xs text-muted">
                <Link href={`/college/${h.college.slug}?tab=hackathons`} className="hover:text-primary">
                  {h.college.name}
                </Link>{" "}
                · {h.college.city}
              </p>
              <dl className="mt-2 space-y-1 text-xs text-slate-700">
                <div><dt className="inline font-medium">Organizer: </dt><dd className="inline">{h.organizer ?? "Information not available"}</dd></div>
                <div><dt className="inline font-medium">Winners: </dt><dd className="inline">{h.winners ?? "Information not available"}</dd></div>
                {h.sponsors.length > 0 && <div><dt className="inline font-medium">Sponsors: </dt><dd className="inline">{h.sponsors.join(", ")}</dd></div>}
              </dl>
              {h.link && (
                <a href={h.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-primary hover:underline">
                  Event link
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}
