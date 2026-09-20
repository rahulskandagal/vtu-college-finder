import type { CollegeProfile } from "@/lib/data/colleges";
import { formatINR, humanize } from "@/lib/utils";
import { Card, CardBody, CardHeader, DemoBadge, EmptyState, SourceNote } from "@/components/ui";

const QUOTA_ORDER = ["KCET", "COMEDK", "MANAGEMENT", "NRI", "OTHER"];

export function FeesTab({ college }: { college: CollegeProfile }) {
  if (college.fees.length === 0) return <EmptyState title="Fee data currently unavailable" description="Fee structures are added per year and per admission quota by an administrator." />;

  const quotas = QUOTA_ORDER.filter((q) => college.fees.some((f) => f.quota === q));
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Fees are shown separately for each admission route. KCET-quota fees are fixed by the Government of Karnataka fee-regulation orders; management / COMEDK fees are set by the college. Never mix the two when budgeting.
      </p>
      {quotas.map((quota) => {
        const rows = college.fees.filter((f) => f.quota === quota).sort((a, b) => b.year - a.year || (a.branch?.shortName ?? "").localeCompare(b.branch?.shortName ?? ""));
        return (
          <Card key={quota}>
            <CardHeader title={`${quota === "KCET" ? "KCET (government) quota" : humanize(quota) + " quota"}`} subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"} · annual amounts in ₹`} />
            <CardBody className="p-0">
              <div className="scroll-x">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Branch</th>
                      <th>Tuition</th>
                      <th>University / VTU</th>
                      <th>Exam</th>
                      <th>Other mandatory</th>
                      <th>Total</th>
                      <th>Hostel</th>
                      <th>Mess</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((f) => (
                      <tr key={f.id}>
                        <td className="font-medium">{f.year}</td>
                        <td>{f.branch?.shortName ?? "All branches"}</td>
                        <td>{formatINR(f.tuitionFee)}</td>
                        <td>{formatINR(f.universityFee)}</td>
                        <td>{formatINR(f.examFee)}</td>
                        <td>{formatINR(f.otherFee)}</td>
                        <td className="font-semibold">{formatINR(f.tuitionFee + f.universityFee + f.examFee + f.otherFee)}</td>
                        <td>{formatINR(f.hostelFee)}</td>
                        <td>{formatINR(f.messFee)}</td>
                        <td className="text-xs">
                          {f.source?.name ?? "—"} {f.isDemo && <DemoBadge className="ml-1" />}
                          {f.notes && <span className="block text-muted">{f.notes}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3">
                <SourceNote source={rows[0]?.source} updatedAt={rows[0]?.updatedAt} />
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
