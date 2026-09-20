import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { compareBranches } from "@/lib/data/branches";
import { CutoffTrendChart } from "@/components/charts/cutoff-trend-chart";
import { formatINR, formatRank, humanize } from "@/lib/utils";
import { Card, CardBody, CardHeader, Container, Disclaimer, EmptyState, PageHeader } from "@/components/ui";
import { BranchPicker } from "@/components/college/branch-picker";

export const metadata: Metadata = { title: "Compare branches", description: "Compare engineering branches — CSE vs ISE vs AI&ML vs ECE — on cutoffs, fees, subjects, careers and trends." };
export const dynamic = "force-dynamic";

export default async function CompareBranchesPage({ searchParams }: { searchParams: Promise<{ b?: string; category?: string }> }) {
  const { b, category: rawCat } = await searchParams;
  const category = (rawCat ?? "GM").toUpperCase();
  const all = await prisma.branch.findMany({ select: { slug: true, shortName: true, name: true }, orderBy: { name: "asc" } });
  const defaults = ["computer-science-engineering", "information-science-engineering", "artificial-intelligence-machine-learning", "electronics-communication-engineering"].filter((s) => all.some((a) => a.slug === s));
  const slugs = (b ? b.split(",").map((s) => s.trim()).filter(Boolean) : defaults).slice(0, 4);
  const data = await compareBranches(slugs, category);
  const ordered = slugs.map((s) => data.find((d) => d.branch.slug === s)).filter((d): d is (typeof data)[number] => !!d);

  const years = Array.from(new Set(ordered.flatMap((d) => d.trend.map((t) => t.year)))).sort((a, b) => a - b);
  const chartRows = years.map((year) => {
    const row: Record<string, number | null> = { year };
    for (const d of ordered) row[d.branch.shortName] = d.trend.find((t) => t.year === year)?.median ?? null;
    return row;
  });

  const rows: { label: string; cells: React.ReactNode[] }[] = [
    { label: "Category", cells: ordered.map((d) => humanize(d.branch.category)) },
    { label: "Duration", cells: ordered.map((d) => `${d.branch.durationYears} years`) },
    { label: "Colleges offering (in database)", cells: ordered.map((d) => d.collegesCount) },
    { label: `Latest ${category} closing rank range`, cells: ordered.map((d) => (d.latestClosingRange ? `${formatRank(d.latestClosingRange.min)} – ${formatRank(d.latestClosingRange.max)}` : "—")) },
    { label: "KCET fee range (branch-specific records)", cells: ordered.map((d) => (d.feeRange ? `${formatINR(d.feeRange.min)} – ${formatINR(d.feeRange.max)} (${d.feeRange.year})` : "Uses college-wide fee")) },
    { label: "Labs (departments in database)", cells: ordered.map((d) => d.labsCount) },
    { label: "Core subjects", cells: ordered.map((d) => <ul key={d.branch.id} className="list-disc pl-4 text-xs">{d.branch.subjects.slice(0, 8).map((s) => <li key={s}>{s}</li>)}</ul>) },
    { label: "Career areas", cells: ordered.map((d) => <ul key={d.branch.id} className="list-disc pl-4 text-xs">{d.branch.careers.map((s) => <li key={s}>{s}</li>)}</ul>) },
    { label: "Higher studies", cells: ordered.map((d) => <ul key={d.branch.id} className="list-disc pl-4 text-xs">{d.branch.higherStudies.map((s) => <li key={s}>{s}</li>)}</ul>) },
    { label: "Typical skills", cells: ordered.map((d) => d.branch.skills.join(", ")) },
  ];

  return (
    <Container className="py-8">
      <PageHeader title="Compare branches" description="Side-by-side view of up to four branches. Cutoff figures are aggregated across all colleges in the database for the chosen category." />

      <BranchPicker options={all} selected={slugs} category={category} />

      {ordered.length < 2 ? (
        <EmptyState title="Select at least two branches" />
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader title={`Median ${category} closing rank across colleges, by year`} subtitle="Median of each college's final-round closing rank. Lower = more competitive." />
            <CardBody>
              <CutoffTrendChart rows={chartRows} keys={ordered.map((d) => d.branch.shortName)} />
            </CardBody>
          </Card>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-56">Criteria</th>
                    {ordered.map((d) => (
                      <th key={d.branch.id} className="min-w-48 normal-case tracking-normal">
                        <Link href={`/branches/${d.branch.slug}`} className="text-sm font-semibold text-primary hover:underline">
                          {d.branch.name}
                        </Link>
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
        </>
      )}
      <Disclaimer className="mt-8" />
    </Container>
  );
}
