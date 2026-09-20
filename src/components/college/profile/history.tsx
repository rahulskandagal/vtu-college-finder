import Link from "next/link";
import type { CollegeProfile } from "@/lib/data/colleges";
import { formatINR, formatLPA, formatPercent } from "@/lib/utils";
import { Card, CardBody, CardHeader, DemoBadge, EmptyState, SourceNote } from "@/components/ui";

/**
 * History tab: institutional timeline + a year-by-year snapshot that combines
 * fee, placement, event and achievement records so students can pick a year
 * and see what the college looked like then.
 */
export function HistoryTab({ college }: { college: CollegeProfile }) {
  const years = new Set<number>();
  college.fees.forEach((f) => years.add(f.year));
  college.placements.forEach((p) => years.add(p.year));
  college.events.forEach((e) => years.add(e.year));
  college.achievements.forEach((a) => years.add(a.year));
  college.hackathons.forEach((h) => years.add(h.year));
  const yearList = Array.from(years).sort((a, b) => b - a);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader title="Timeline" subtitle="Milestones from official sources" />
          <CardBody>
            {college.history && <p className="mb-4 text-sm text-slate-700">{college.history}</p>}
            {college.milestones.length === 0 ? (
              <EmptyState title="Timeline currently unavailable" />
            ) : (
              <ol className="relative border-l border-border pl-5">
                {college.milestones.map((m) => (
                  <li key={m.id} className="mb-5 last:mb-0">
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{m.year}</p>
                    <p className="font-medium">
                      {m.title} {m.isDemo && <DemoBadge className="ml-1" />}
                    </p>
                    {m.description && <p className="text-xs text-muted">{m.description}</p>}
                    <SourceNote source={m.source} className="mt-1" />
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader title="Year-by-year snapshot" subtitle="Cutoff history is on the Cutoffs tab; this combines fees, placements, events and achievements per year." />
          <CardBody className="p-0">
            {yearList.length === 0 ? (
              <EmptyState className="m-4" />
            ) : (
              <div className="scroll-x">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>KCET fee (total)</th>
                      <th>Placement %</th>
                      <th>Average pkg</th>
                      <th>Events</th>
                      <th>Hackathons</th>
                      <th>Achievements</th>
                      <th>Cutoffs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearList.map((y) => {
                      const fee = college.fees.find((f) => f.year === y && f.quota === "KCET" && f.branchId === null) ?? college.fees.find((f) => f.year === y && f.quota === "KCET");
                      const pl = college.placements.find((p) => p.year === y && p.departmentId === null);
                      const ev = college.events.filter((e) => e.year === y).length;
                      const hk = college.hackathons.filter((h) => h.year === y).length;
                      const ach = college.achievements.filter((a) => a.year === y);
                      return (
                        <tr key={y}>
                          <td className="font-semibold">{y}</td>
                          <td>{fee ? formatINR(fee.tuitionFee + fee.universityFee + fee.examFee + fee.otherFee) : "—"}</td>
                          <td>{pl ? formatPercent(pl.placementPercent) : "—"}</td>
                          <td>{pl ? formatLPA(pl.averagePackage) : "—"}</td>
                          <td>{ev || "—"}</td>
                          <td>{hk || "—"}</td>
                          <td className="max-w-xs text-xs">{ach.length ? ach.map((a) => a.title).join("; ") : "—"}</td>
                          <td>
                            <Link href={`/college/${college.slug}?tab=cutoffs`} className="text-xs text-primary hover:underline">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Achievements" />
          <CardBody>
            {college.achievements.length === 0 ? (
              <EmptyState title="Achievement records currently unavailable" />
            ) : (
              <ul className="space-y-2">
                {college.achievements.map((a) => (
                  <li key={a.id} className="text-sm">
                    <span className="font-medium">{a.year}</span> — {a.title} {a.isDemo && <DemoBadge className="ml-1" />}
                    {a.description && <p className="text-xs text-muted">{a.description}</p>}
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
