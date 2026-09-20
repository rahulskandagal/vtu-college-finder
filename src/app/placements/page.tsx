import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatLPA, formatPercent } from "@/lib/utils";
import { Container, DemoBadge, EmptyState, PageHeader } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";

export const metadata: Metadata = { title: "Placements", description: "Placement statistics across VTU engineering colleges — placement rate, average, median and highest packages by year, with sources." };
export const dynamic = "force-dynamic";

export default async function PlacementsPage({ searchParams }: { searchParams: Promise<{ year?: string; sort?: string }> }) {
  const { year: rawYear, sort } = await searchParams;
  const years = (await prisma.placement.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "desc" } })).map((y) => y.year);
  const year = rawYear ? Number(rawYear) : years[0];
  const rows = year
    ? await prisma.placement.findMany({
        where: { year, departmentId: null },
        include: { college: { select: { slug: true, name: true, shortName: true, district: true, isDemo: true } }, source: { select: { name: true, url: true } } },
      })
    : [];
  const key = (sort === "average" ? "averagePackage" : sort === "highest" ? "highestPackage" : sort === "median" ? "medianPackage" : "placementPercent") as "averagePackage" | "highestPackage" | "medianPackage" | "placementPercent";
  rows.sort((a, b) => (b[key] ?? -1) - (a[key] ?? -1));

  return (
    <Container className="py-8">
      <PageHeader title="Placements" description="College-wide placement figures as published in institutional reports. Only records with a recorded source are shown; department-wise data lives on each college page.">
        <div className="flex gap-2">
          <AutoSubmitSelect param="year" defaultValue={String(year ?? "")} className="w-28" aria-label="Year">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect param="sort" defaultValue={sort ?? "percent"} className="w-44" aria-label="Sort">
            <option value="percent">Sort: placement %</option>
            <option value="average">Sort: average package</option>
            <option value="median">Sort: median package</option>
            <option value="highest">Sort: highest package</option>
          </AutoSubmitSelect>
        </div>
      </PageHeader>
      {rows.length === 0 ? (
        <EmptyState title="Placement data currently unavailable" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="scroll-x">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>College</th>
                  <th>Placement %</th>
                  <th>Placed / eligible</th>
                  <th>Highest</th>
                  <th>Average</th>
                  <th>Median</th>
                  <th>Recruiters</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <Link href={`/college/${p.college.slug}?tab=placements`} className="font-medium text-primary hover:underline">
                        {p.college.name}
                      </Link>
                      {p.isDemo && <DemoBadge className="ml-1" />}
                      <span className="block text-xs text-muted">{p.college.district}</span>
                    </td>
                    <td className="font-semibold">{formatPercent(p.placementPercent)}</td>
                    <td>
                      {p.studentsPlaced ?? "—"} / {p.studentsEligible ?? "—"}
                    </td>
                    <td>{formatLPA(p.highestPackage)}</td>
                    <td>{formatLPA(p.averagePackage)}</td>
                    <td>{formatLPA(p.medianPackage)}</td>
                    <td>{p.recruitersCount ?? "—"}</td>
                    <td className="text-xs">
                      {p.source?.url ? (
                        <a href={p.source.url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                          {p.source.name}
                        </a>
                      ) : (
                        p.source?.name ?? "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">Packages are in lakhs per annum (LPA) as reported by the institution. Reporting methodology differs between colleges; compare with care.</p>
    </Container>
  );
}
