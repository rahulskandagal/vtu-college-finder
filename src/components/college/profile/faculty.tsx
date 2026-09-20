import type { CollegeProfile } from "@/lib/data/colleges";
import { Card, CardBody, CardHeader, DemoBanner, EmptyState, SourceNote } from "@/components/ui";

const NA = <span className="text-muted">Information not available</span>;

export function FacultyTab({ college }: { college: CollegeProfile }) {
  if (college.faculty.length === 0) return <EmptyState title="Faculty directory currently unavailable" description="Faculty records are only listed from official institutional profiles." />;
  const byDept = new Map<string, typeof college.faculty>();
  for (const f of college.faculty) {
    const key = f.department?.name ?? "Other";
    if (!byDept.has(key)) byDept.set(key, []);
    byDept.get(key)!.push(f);
  }
  const anyDemo = college.faculty.some((f) => f.isDemo);
  return (
    <div className="space-y-6">
      {anyDemo && <DemoBanner />}
      <p className="text-sm text-muted">{college.faculty.length} faculty records across {byDept.size} departments. Fields that have not been verified are shown as “Information not available”.</p>
      {Array.from(byDept.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dept, list]) => (
          <Card key={dept}>
            <CardHeader title={dept} subtitle={`${list.length} member${list.length === 1 ? "" : "s"}`} />
            <CardBody className="p-0">
              <div className="scroll-x">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Qualification</th>
                      <th>Specialization</th>
                      <th>Research interests</th>
                      <th>Experience</th>
                      <th>Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((f) => (
                      <tr key={f.id}>
                        <td className="font-medium">{f.name}</td>
                        <td>{f.designation ?? NA}</td>
                        <td>{f.qualification ?? NA}</td>
                        <td>{f.specialization ?? NA}</td>
                        <td>{f.researchInterests.length ? f.researchInterests.join(", ") : NA}</td>
                        <td>{f.experienceYears != null ? `${f.experienceYears} yrs` : NA}</td>
                        <td>
                          {f.profileUrl ? (
                            <a href={f.profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Institutional profile
                            </a>
                          ) : (
                            NA
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3">
                <SourceNote source={list[0]?.source} updatedAt={list[0]?.updatedAt} />
              </div>
            </CardBody>
          </Card>
        ))}
    </div>
  );
}
