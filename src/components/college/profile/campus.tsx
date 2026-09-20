import type { CollegeProfile } from "@/lib/data/colleges";
import { formatINR, humanize } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, DefinitionList, DemoBadge, EmptyState, SourceNote } from "@/components/ui";

export function CampusTab({ college }: { college: CollegeProfile }) {
  if (college.facilities.length === 0 && !college.campusAcres) return <EmptyState title="Campus information currently unavailable" />;
  const byCat = new Map<string, typeof college.facilities>();
  for (const f of college.facilities) {
    if (!byCat.has(f.category)) byCat.set(f.category, []);
    byCat.get(f.category)!.push(f);
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Campus at a glance" />
        <CardBody>
          <DefinitionList
            items={[
              { label: "Campus size", value: college.campusAcres ? `${college.campusAcres} acres` : "Information not available" },
              { label: "Location", value: `${college.city}, ${college.district}` },
              { label: "Facilities listed", value: college.facilities.length },
              { label: "Hostel", value: college.hostelAvailable ? "Available (see Hostel tab)" : "Not listed" },
            ]}
          />
        </CardBody>
      </Card>
      {college.images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {college.images.map((img) => (
            <figure key={img.id} className="overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption ?? college.name} className="h-44 w-full object-cover" />
              {(img.caption || img.credit) && (
                <figcaption className="px-3 py-2 text-xs text-muted">
                  {img.caption} {img.credit && <span>· © {img.credit}</span>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from(byCat.entries()).map(([cat, list]) => (
          <Card key={cat}>
            <CardHeader title={humanize(cat)} action={list.some((f) => f.isDemo) ? <DemoBadge /> : undefined} />
            <CardBody>
              <ul className="space-y-2">
                {list.map((f) => (
                  <li key={f.id} className="text-sm">
                    <span className="font-medium">{f.name}</span>
                    {f.description && <p className="text-xs text-muted">{f.description}</p>}
                  </li>
                ))}
              </ul>
              <SourceNote source={list[0]?.source} className="mt-3" />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function LabsTab({ college }: { college: CollegeProfile }) {
  if (college.laboratories.length === 0) return <EmptyState title="Laboratory information currently unavailable" />;
  const byDept = new Map<string, typeof college.laboratories>();
  for (const l of college.laboratories) {
    const key = l.department?.name ?? "General";
    if (!byDept.has(key)) byDept.set(key, []);
    byDept.get(key)!.push(l);
  }
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{college.laboratories.length} laboratories across {byDept.size} departments. Equipment lists are shown only where officially documented.</p>
      {Array.from(byDept.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dept, labs]) => (
          <Card key={dept}>
            <CardHeader title={dept} subtitle={`${labs.length} lab${labs.length === 1 ? "" : "s"}`} action={labs.some((l) => l.isDemo) ? <DemoBadge /> : undefined} />
            <CardBody>
              <ul className="grid gap-3 sm:grid-cols-2">
                {labs.map((l) => (
                  <li key={l.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{l.name}</p>
                    <p className="mt-1 text-xs text-muted">{l.purpose ?? "Purpose: information not available"}</p>
                    {l.equipment.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {l.equipment.map((e) => (
                          <Badge key={e}>{e}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted">Equipment list: information not available</p>
                    )}
                    {l.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt={l.name} className="mt-2 h-32 w-full rounded object-cover" />
                    )}
                  </li>
                ))}
              </ul>
              <SourceNote source={labs[0]?.source} className="mt-3" />
            </CardBody>
          </Card>
        ))}
    </div>
  );
}

export function HostelTab({ college }: { college: CollegeProfile }) {
  if (college.hostels.length === 0) {
    return <EmptyState title={college.hostelAvailable ? "Hostel details currently unavailable" : "No hostel information listed for this college"} />;
  }
  const yesNo = (v: boolean | null) => (v === null ? "Information not available" : v ? "Yes" : "No");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {college.hostels.map((h) => (
        <Card key={h.id}>
          <CardHeader title={h.name ?? `${humanize(h.type)} hostel`} subtitle={humanize(h.type)} action={h.isDemo ? <DemoBadge /> : undefined} />
          <CardBody>
            <DefinitionList
              items={[
                { label: "Capacity", value: h.capacity ?? "Information not available" },
                { label: "Hostel fee / year", value: h.feePerYear != null ? formatINR(h.feePerYear) : "Information not available" },
                { label: "Mess fee / year", value: h.messFeePerYear != null ? formatINR(h.messFeePerYear) : "Information not available" },
                { label: "Wi-Fi", value: yesNo(h.wifi) },
                { label: "Study areas", value: yesNo(h.studyArea) },
                { label: "Security", value: h.security ?? "Information not available" },
                { label: "Distance from academic block", value: h.distanceFromCampus ?? "Information not available" },
                { label: "Transport", value: h.transport ?? "Information not available" },
              ]}
            />
            {h.rules && (
              <div className="mt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Rules</p>
                <p className="text-sm">{h.rules}</p>
              </div>
            )}
            <SourceNote source={h.source} className="mt-3" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
