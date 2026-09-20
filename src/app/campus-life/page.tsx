import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container, DemoBadge, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Campus life", description: "Clubs, fests, hackathons, sports and student activities at VTU engineering colleges — compare how active each campus is." };
export const dynamic = "force-dynamic";

export default async function CampusLifePage() {
  const colleges = await prisma.college.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, slug: true, name: true, shortName: true, city: true, district: true, isDemo: true, hostelAvailable: true, campusAcres: true,
      _count: { select: { clubs: true, events: true, hackathons: true, facilities: true, laboratories: true, hostels: true } },
      clubs: { select: { name: true, category: true }, take: 6 },
      events: { where: { OR: [{ type: "TECHNICAL_FEST" }, { type: "CULTURAL_FEST" }] }, orderBy: { year: "desc" }, take: 2, select: { name: true, year: true } },
    },
  });
  if (colleges.length === 0) return <Container className="py-8"><EmptyState /></Container>;

  return (
    <Container className="py-8">
      <PageHeader title="Campus life" description="A quick read on how vibrant each campus is: clubs, festivals, hackathons, sports and facilities recorded in the database.">
        <div className="flex gap-2">
          <LinkButton href="/clubs" variant="outline" size="sm">Clubs</LinkButton>
          <LinkButton href="/events" variant="outline" size="sm">Events</LinkButton>
          <LinkButton href="/hackathons" variant="outline" size="sm">Hackathons</LinkButton>
        </div>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colleges.map((c) => (
          <article key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/college/${c.slug}?tab=student-life`} className="font-semibold hover:text-primary">
                  {c.name}
                </Link>
                <p className="text-xs text-muted">{c.city}, {c.district}</p>
              </div>
              {c.isDemo && <DemoBadge />}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              {[
                ["Clubs", c._count.clubs, "clubs"],
                ["Events", c._count.events, "events"],
                ["Hackathons", c._count.hackathons, "hackathons"],
                ["Labs", c._count.laboratories, "labs"],
                ["Facilities", c._count.facilities, "campus"],
                ["Hostels", c._count.hostels || (c.hostelAvailable ? "Yes" : "—"), "hostel"],
              ].map(([k, v, tab]) => (
                <Link key={String(k)} href={`/college/${c.slug}?tab=${tab}`} className="rounded-lg bg-slate-50 p-2 hover:bg-slate-100">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-base font-semibold">{v}</dd>
                </Link>
              ))}
            </dl>
            {c.clubs.length > 0 && <p className="mt-3 text-xs text-slate-700">{c.clubs.map((cl) => cl.name).join(" · ")}</p>}
            {c.events.length > 0 && <p className="mt-1 text-xs text-muted">Recent fests: {c.events.map((e) => `${e.name} (${e.year})`).join(", ")}</p>}
          </article>
        ))}
      </div>
    </Container>
  );
}
