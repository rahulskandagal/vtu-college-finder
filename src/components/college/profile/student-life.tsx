import Link from "next/link";
import type { CollegeProfile } from "@/lib/data/colleges";
import { formatDate, humanize } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, DemoBadge, EmptyState, SourceNote, Stat } from "@/components/ui";

export function ClubsTab({ college }: { college: CollegeProfile }) {
  if (college.clubs.length === 0) return <EmptyState title="Club information currently unavailable" />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {college.clubs.map((c) => (
        <Card key={c.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-muted">
                  {humanize(c.category)}
                  {c.department && <> · {c.department.name}</>}
                </p>
              </div>
              {c.isDemo && <DemoBadge />}
            </div>
            {c.description && <p className="mt-2 text-sm text-slate-700">{c.description}</p>}
            {c.activities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.activities.map((a) => (
                  <Badge key={a}>{a}</Badge>
                ))}
              </div>
            )}
            {c.achievements && <p className="mt-2 text-xs text-slate-700">Achievements: {c.achievements}</p>}
            {c.contactLink && (
              <a href={c.contactLink} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-primary hover:underline">
                Official page / social
              </a>
            )}
            <SourceNote source={c.source} className="mt-3" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function EventsTab({ college }: { college: CollegeProfile }) {
  if (college.events.length === 0) return <EmptyState title="Event records currently unavailable" />;
  const years = Array.from(new Set(college.events.map((e) => e.year))).sort((a, b) => b - a);
  return (
    <div className="space-y-6">
      {years.map((y) => (
        <Card key={y}>
          <CardHeader title={String(y)} subtitle={`${college.events.filter((e) => e.year === y).length} events`} />
          <CardBody className="p-0">
            <div className="scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Department</th>
                    <th>Participants</th>
                    <th>Description / results</th>
                  </tr>
                </thead>
                <tbody>
                  {college.events
                    .filter((e) => e.year === y)
                    .map((e) => (
                      <tr key={e.id}>
                        <td className="font-medium">
                          {e.name} {e.isDemo && <DemoBadge className="ml-1" />}
                        </td>
                        <td>{humanize(e.type)}</td>
                        <td>{formatDate(e.date)}</td>
                        <td>{e.department?.name ?? "College-wide"}</td>
                        <td>{e.participants ?? "—"}</td>
                        <td className="max-w-md text-xs text-slate-700">
                          {e.description ?? "—"}
                          {e.results && <span className="block text-muted">Results: {e.results}</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function HackathonsTab({ college }: { college: CollegeProfile }) {
  if (college.hackathons.length === 0) return <EmptyState title="Hackathon records currently unavailable" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Hackathons recorded" value={college.hackathons.length} />
        <Stat label="Years active" value={new Set(college.hackathons.map((h) => h.year)).size} />
        <Stat label="Total participants" value={college.hackathons.reduce((a, h) => a + (h.participants ?? 0), 0).toLocaleString("en-IN")} hint="where recorded" />
        <Stat label="Latest" value={Math.max(...college.hackathons.map((h) => h.year))} />
      </div>
      {college.hackathons.map((h) => (
        <Card key={h.id}>
          <CardBody>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">
                  {h.name} <span className="text-muted">· {h.year}</span>
                </h3>
                <p className="text-xs text-muted">Organizer: {h.organizer ?? "Information not available"}</p>
              </div>
              <div className="flex gap-1">
                {h.isDemo && <DemoBadge />}
                {h.participants != null && <Badge>{h.participants} participants</Badge>}
              </div>
            </div>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Winners</dt>
                <dd>{h.winners ?? "Information not available"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Projects</dt>
                <dd>{h.projects ?? "Information not available"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Sponsors</dt>
                <dd>{h.sponsors.length ? h.sponsors.join(", ") : "Information not available"}</dd>
              </div>
            </dl>
            {h.link && (
              <a href={h.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-primary hover:underline">
                Event link
              </a>
            )}
            <SourceNote source={h.source} className="mt-3" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function StudentLifeTab({ college }: { college: CollegeProfile }) {
  const clubsByCat = new Map<string, number>();
  for (const c of college.clubs) clubsByCat.set(c.category, (clubsByCat.get(c.category) ?? 0) + 1);
  const fests = college.events.filter((e) => e.type === "TECHNICAL_FEST" || e.type === "CULTURAL_FEST");
  const sports = college.events.filter((e) => e.type === "SPORTS");
  const nss = college.clubs.filter((c) => /nss|ncc/i.test(c.name));
  const ecell = college.clubs.filter((c) => c.category === "ENTREPRENEURSHIP");
  const base = `/college/${college.slug}?tab=`;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Clubs" value={college.clubs.length} hint={<Link href={`${base}clubs`} className="text-primary">See clubs</Link>} />
        <Stat label="Fests recorded" value={fests.length} hint={<Link href={`${base}events`} className="text-primary">See events</Link>} />
        <Stat label="Hackathons" value={college.hackathons.length} hint={<Link href={`${base}hackathons`} className="text-primary">See hackathons</Link>} />
        <Stat label="Sports events" value={sports.length} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Clubs by category" />
          <CardBody>
            {clubsByCat.size === 0 ? (
              <EmptyState />
            ) : (
              <ul className="space-y-1 text-sm">
                {Array.from(clubsByCat.entries()).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{humanize(k)}</span>
                    <span className="font-medium">{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Festivals & competitions" />
          <CardBody>
            {fests.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="space-y-1 text-sm">
                {fests.slice(0, 8).map((e) => (
                  <li key={e.id} className="flex justify-between">
                    <span>{e.name}</span>
                    <span className="text-muted">{e.year}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="NSS / NCC" />
          <CardBody>
            {nss.length === 0 ? <EmptyState title="Information not available" /> : <ul className="list-disc pl-5 text-sm">{nss.map((c) => <li key={c.id}>{c.name}</li>)}</ul>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Entrepreneurship & innovation" />
          <CardBody>
            {ecell.length === 0 ? (
              <EmptyState title="Information not available" />
            ) : (
              <ul className="list-disc pl-5 text-sm">
                {ecell.map((c) => (
                  <li key={c.id}>
                    {c.name}
                    {c.description && <span className="text-muted"> — {c.description}</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
