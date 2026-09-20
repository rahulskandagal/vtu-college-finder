import type { CollegeProfile } from "@/lib/data/colleges";
import { formatLPA, formatPercent, humanize } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, DemoBadge, EmptyState, SourceNote, Stat } from "@/components/ui";
import { PlacementTrendChart } from "@/components/charts/placement-trend-chart";
import { RecruiterList } from "./recruiter-list";

export function PlacementsTab({ college }: { college: CollegeProfile }) {
  const collegeWide = college.placements.filter((p) => p.departmentId === null).sort((a, b) => b.year - a.year);
  const deptWise = college.placements.filter((p) => p.departmentId !== null).sort((a, b) => b.year - a.year || (a.department?.name ?? "").localeCompare(b.department?.name ?? ""));
  const latest = collegeWide[0];

  if (college.placements.length === 0 && college.recruiters.length === 0) {
    return <EmptyState title="Placement data currently unavailable" description="Placement statistics are only shown when they come from institutional reports with a recorded source." />;
  }

  return (
    <div className="space-y-6">
      {latest && (
        <>
          <div className="flex items-center gap-2 text-sm text-muted">
            Latest college-wide figures · {latest.year} {latest.isDemo && <DemoBadge />}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Stat label="Placement rate" value={formatPercent(latest.placementPercent)} />
            <Stat label="Students placed" value={latest.studentsPlaced ?? "—"} hint={latest.studentsEligible ? `of ${latest.studentsEligible} eligible` : undefined} />
            <Stat label="Highest package" value={formatLPA(latest.highestPackage)} />
            <Stat label="Average package" value={formatLPA(latest.averagePackage)} />
            <Stat label="Median package" value={formatLPA(latest.medianPackage)} />
            <Stat label="Recruiters" value={latest.recruitersCount ?? "—"} />
          </div>
          {latest.internshipInfo && <p className="text-sm text-slate-700">Internships: {latest.internshipInfo}</p>}
          <SourceNote source={latest.source} updatedAt={latest.updatedAt} />
        </>
      )}

      {collegeWide.length > 1 && (
        <Card>
          <CardHeader title="Placement history" subtitle="College-wide, by year" />
          <CardBody>
            <PlacementTrendChart rows={collegeWide.map((p) => ({ year: p.year, percent: p.placementPercent, average: p.averagePackage, median: p.medianPackage, highest: p.highestPackage })).reverse()} />
            <div className="scroll-x mt-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Placement %</th>
                    <th>Placed</th>
                    <th>Highest</th>
                    <th>Average</th>
                    <th>Median</th>
                    <th>Lowest</th>
                    <th>Recruiters</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {collegeWide.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.year}</td>
                      <td>{formatPercent(p.placementPercent)}</td>
                      <td>{p.studentsPlaced ?? "—"}</td>
                      <td>{formatLPA(p.highestPackage)}</td>
                      <td>{formatLPA(p.averagePackage)}</td>
                      <td>{formatLPA(p.medianPackage)}</td>
                      <td>{formatLPA(p.lowestPackage)}</td>
                      <td>{p.recruitersCount ?? "—"}</td>
                      <td className="text-xs">
                        {p.source?.name ?? "—"} {p.isDemo && <DemoBadge className="ml-1" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Department-wise placements" />
        <CardBody className="p-0">
          {deptWise.length === 0 ? (
            <EmptyState className="m-4" title="Department-wise placement data currently unavailable" />
          ) : (
            <div className="scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Department</th>
                    <th>Placement %</th>
                    <th>Highest</th>
                    <th>Average</th>
                    <th>Median</th>
                  </tr>
                </thead>
                <tbody>
                  {deptWise.map((p) => (
                    <tr key={p.id}>
                      <td>{p.year}</td>
                      <td>{p.department?.name}</td>
                      <td>{formatPercent(p.placementPercent)}</td>
                      <td>{formatLPA(p.highestPackage)}</td>
                      <td>{formatLPA(p.averagePackage)}</td>
                      <td>{formatLPA(p.medianPackage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recruiters" subtitle="Companies recorded as having recruited from this college. Filter by sector." action={college.recruiters.some((r) => r.isDemo) ? <DemoBadge /> : <Badge>{college.recruiters.length}</Badge>} />
        <CardBody>
          {college.recruiters.length === 0 ? (
            <EmptyState title="Recruiter list currently unavailable" />
          ) : (
            <RecruiterList recruiters={college.recruiters.map((r) => ({ name: r.recruiter.name, sector: humanize(r.recruiter.sector), sectorKey: r.recruiter.sector, year: r.year }))} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
