import Link from "next/link";
import type { CollegeProfile } from "@/lib/data/colleges";
import type { BranchStat } from "./tabs";
import { formatINR, formatLPA, formatPercent, formatRank, humanize } from "@/lib/utils";
import { Card, CardBody, CardHeader, DefinitionList, EmptyState, SourceNote, Stat } from "@/components/ui";

export function OverviewTab({ college, branchStats }: { college: CollegeProfile; branchStats: BranchStat[] }) {
  const latestFee = college.fees.find((f) => f.quota === "KCET" && f.branchId === null) ?? college.fees.find((f) => f.quota === "KCET");
  const latestPlacement = college.placements.find((p) => p.departmentId === null) ?? college.placements[0];
  const best = [...branchStats].filter((b) => b.stats.latest).sort((a, b) => a.stats.latest!.finalClosing - b.stats.latest!.finalClosing);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader title="About the college" />
          <CardBody className="prose-sm text-sm text-slate-700">
            {college.description ? <p>{college.description}</p> : <EmptyState title="Description currently unavailable" />}
            {college.vision && (
              <>
                <h4 className="mt-4 font-semibold">Vision</h4>
                <p>{college.vision}</p>
              </>
            )}
            {college.mission && (
              <>
                <h4 className="mt-4 font-semibold">Mission</h4>
                <p>{college.mission}</p>
              </>
            )}
            <SourceNote source={college.source} updatedAt={college.updatedAt} className="mt-4" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick facts" />
          <CardBody>
            <DefinitionList
              items={[
                { label: "College code (KEA)", value: college.code },
                { label: "Established", value: college.establishedYear ?? "Information not available" },
                { label: "Type", value: humanize(college.type) },
                { label: "Affiliation", value: college.affiliation },
                { label: "University", value: college.university ?? college.affiliation },
                { label: "Autonomous", value: college.autonomous ? "Yes" : "No" },
                { label: "Accreditation", value: college.accreditation.length ? college.accreditation.join(", ") : "Information not available" },
                { label: "Principal / Director", value: college.principal ?? "Information not available" },
                { label: "Campus", value: college.campusAcres ? `${college.campusAcres} acres` : "Information not available" },
                { label: "Address", value: college.address ?? `${college.city}, ${college.district}` },
                { label: "Email", value: college.email ?? "Information not available" },
                { label: "Phone", value: college.phone ?? "Information not available" },
                {
                  label: "Website",
                  value: college.website ? (
                    <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {college.website}
                    </a>
                  ) : (
                    "Information not available"
                  ),
                },
                { label: "Hostel", value: college.hostelAvailable ? "Available" : "Not listed" },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Latest GM closing ranks by branch" subtitle="Final counselling round of the most recent year with data. Open the Cutoffs tab for full history." />
          <CardBody className="p-0">
            {best.length === 0 ? (
              <EmptyState className="m-4" />
            ) : (
              <div className="scroll-x">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Year</th>
                      <th>Closing rank</th>
                      <th>3-yr range</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {best.map((b) => (
                      <tr key={b.branchId}>
                        <td>
                          <Link href={`/college/${college.slug}/${b.branch.slug}`} className="font-medium text-primary hover:underline">
                            {b.branch.shortName}
                          </Link>{" "}
                          <span className="text-muted">{b.branch.name}</span>
                        </td>
                        <td>{b.stats.latest!.year} (R{b.stats.latest!.finalRound})</td>
                        <td className="font-semibold">{formatRank(b.stats.latest!.finalClosing)}</td>
                        <td>
                          {formatRank(b.stats.recentMin)} – {formatRank(b.stats.recentMax)}
                        </td>
                        <td className="text-xs">{humanize(b.stats.trend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4">
        <Stat label="Branches offered" value={college.branches.length} hint="B.E. programmes listed" />
        <Stat
          label="KCET quota fee / year"
          value={latestFee ? formatINR(latestFee.tuitionFee + latestFee.universityFee + latestFee.examFee + latestFee.otherFee) : "—"}
          hint={latestFee ? `${latestFee.year} · tuition + mandatory fees` : "Data currently unavailable"}
        />
        <Stat
          label="Placement rate"
          value={latestPlacement?.placementPercent != null ? formatPercent(latestPlacement.placementPercent) : "—"}
          hint={latestPlacement ? `${latestPlacement.year} · avg ${formatLPA(latestPlacement.averagePackage)} · high ${formatLPA(latestPlacement.highestPackage)}` : "Data currently unavailable"}
        />
        <Stat label="Departments" value={college.departments.length} />
        <Stat label="Laboratories listed" value={college.laboratories.length} />
        <Stat label="Clubs listed" value={college.clubs.length} />
        <Stat label="Events & hackathons" value={college.events.length + college.hackathons.length} hint="records in the database" />
      </div>
    </div>
  );
}
