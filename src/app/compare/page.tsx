import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCollegeBranchStats } from "@/lib/data/cutoffs";
import { formatINR, formatLPA, formatPercent, formatRank, humanize } from "@/lib/utils";
import { Container, DemoBadge, Disclaimer, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { ComparePicker } from "@/components/college/compare-picker";
import { MAX_COMPARE } from "@/lib/constants";

export const metadata: Metadata = { title: "Compare colleges", description: "Compare up to four VTU engineering colleges side by side: cutoffs, fees, placements, hostels, labs, clubs and more." };
export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const slugs = (c ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_COMPARE);
  const allColleges = await prisma.college.findMany({ select: { slug: true, name: true, shortName: true, district: true }, orderBy: { name: "asc" } });

  const colleges = slugs.length
    ? await prisma.college.findMany({
        where: { slug: { in: slugs } },
        include: {
          branches: { include: { branch: { select: { shortName: true, slug: true } } } },
          fees: { where: { quota: "KCET" }, orderBy: { year: "desc" }, take: 3 },
          placements: { where: { departmentId: null }, orderBy: { year: "desc" }, take: 1 },
          hostels: true,
          _count: { select: { laboratories: true, clubs: true, hackathons: true, events: true, faculty: true, facilities: true } },
        },
      })
    : [];
  const ordered = slugs.map((s) => colleges.find((c) => c.slug === s)).filter((c): c is (typeof colleges)[number] => !!c);
  const statsPer = await Promise.all(ordered.map((c) => getCollegeBranchStats(c.id)));

  const branchSlugs = Array.from(new Set(ordered.flatMap((c) => c.branches.map((b) => b.branch.slug)))).sort();
  const branchName = (slug: string) => ordered.flatMap((c) => c.branches).find((b) => b.branch.slug === slug)?.branch.shortName ?? slug;

  const rows: { label: string; cells: React.ReactNode[] }[] = ordered.length
    ? [
        { label: "Location", cells: ordered.map((c) => `${c.city}, ${c.district}`) },
        { label: "Type", cells: ordered.map((c) => humanize(c.type)) },
        { label: "Established", cells: ordered.map((c) => c.establishedYear ?? "—") },
        { label: "Autonomous", cells: ordered.map((c) => (c.autonomous ? "Yes" : "No")) },
        { label: "Accreditation", cells: ordered.map((c) => c.accreditation.join(", ") || "—") },
        { label: "Branches offered", cells: ordered.map((c) => c.branches.length) },
        {
          label: "KCET fee / year (latest)",
          cells: ordered.map((c) => {
            const f = c.fees.find((x) => x.branchId === null) ?? c.fees[0];
            return f ? `${formatINR(f.tuitionFee + f.universityFee + f.examFee + f.otherFee)} (${f.year})` : "—";
          }),
        },
        { label: "Placement rate", cells: ordered.map((c) => (c.placements[0] ? `${formatPercent(c.placements[0].placementPercent)} (${c.placements[0].year})` : "—")) },
        { label: "Highest package", cells: ordered.map((c) => formatLPA(c.placements[0]?.highestPackage)) },
        { label: "Average package", cells: ordered.map((c) => formatLPA(c.placements[0]?.averagePackage)) },
        { label: "Median package", cells: ordered.map((c) => formatLPA(c.placements[0]?.medianPackage)) },
        { label: "Hostel", cells: ordered.map((c) => (c.hostels.length ? c.hostels.map((h) => `${humanize(h.type)}${h.capacity ? ` (${h.capacity})` : ""}`).join(", ") : c.hostelAvailable ? "Available" : "Not listed")) },
        { label: "Campus size", cells: ordered.map((c) => (c.campusAcres ? `${c.campusAcres} acres` : "—")) },
        { label: "Labs listed", cells: ordered.map((c) => c._count.laboratories) },
        { label: "Facilities listed", cells: ordered.map((c) => c._count.facilities) },
        { label: "Faculty listed", cells: ordered.map((c) => c._count.faculty) },
        { label: "Clubs", cells: ordered.map((c) => c._count.clubs) },
        { label: "Hackathons", cells: ordered.map((c) => c._count.hackathons) },
        { label: "Events", cells: ordered.map((c) => c._count.events) },
        ...branchSlugs.map((slug) => ({
          label: `GM cutoff · ${branchName(slug)}`,
          cells: ordered.map((c, i) => {
            const s = statsPer[i].find((b) => b.branch.slug === slug)?.stats;
            if (!c.branches.some((b) => b.branch.slug === slug)) return <span key={c.id} className="text-muted">not offered</span>;
            return s?.latest ? (
              <Link key={c.id} href={`/college/${c.slug}/${slug}`} className="text-primary hover:underline">
                {formatRank(s.latest.finalClosing)} <span className="text-xs text-muted">({s.latest.year})</span>
              </Link>
            ) : (
              "—"
            );
          }),
        })),
      ]
    : [];

  return (
    <Container className="py-8">
      <PageHeader title="Compare colleges" description={`Pick up to ${MAX_COMPARE} colleges. The table shows the underlying data — there is deliberately no single "best college" score.`}>
        <LinkButton href="/compare/branches" variant="secondary" size="sm">
          Compare branches instead
        </LinkButton>
      </PageHeader>

      <ComparePicker options={allColleges} selected={slugs} />

      {ordered.length < 2 ? (
        <EmptyState className="mt-6" title="Select at least two colleges to compare" description="Use the picker above, or the Compare button on any college card." />
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <div className="scroll-x">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-48">Criteria</th>
                  {ordered.map((c) => (
                    <th key={c.id} className="min-w-44 normal-case tracking-normal">
                      <Link href={`/college/${c.slug}`} className="text-sm font-semibold text-primary hover:underline">
                        {c.name}
                      </Link>
                      {c.isDemo && <DemoBadge className="ml-1" />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td className="font-medium text-slate-700">{r.label}</td>
                    {r.cells.map((cell, i) => (
                      <td key={i}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Disclaimer className="mt-8" />
    </Container>
  );
}
