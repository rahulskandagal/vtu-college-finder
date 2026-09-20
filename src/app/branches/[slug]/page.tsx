import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBranchBySlug, getBranchCutoffOverview } from "@/lib/data/branches";
import { CutoffTrendChart } from "@/components/charts/cutoff-trend-chart";
import { formatRank, humanize } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, Container, DemoBadge, Disclaimer, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { KCET_CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";
type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBranchBySlug(slug);
  if (!b) return { title: "Branch not found" };
  return { title: `${b.name} (${b.shortName}) — colleges, cutoffs, careers`, description: b.about ?? undefined, alternates: { canonical: `/branches/${b.slug}` } };
}

export default async function BranchPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ category?: string }> }) {
  const { slug } = await params;
  const { category: rawCat } = await searchParams;
  const branch = await getBranchBySlug(slug);
  if (!branch) notFound();
  const category = (rawCat ?? "GM").toUpperCase();
  const overview = await getBranchCutoffOverview(branch.id, category);

  // Chart: median closing per year across colleges + best college per year
  const years = Array.from(new Set(overview.flatMap((o) => o.stats.years.map((y) => y.year)))).sort((a, b) => a - b);
  const chartRows = years.map((year) => {
    const vals = overview.map((o) => o.stats.years.find((y) => y.year === year)?.finalClosing).filter((v): v is number => v != null).sort((a, b) => a - b);
    const mid = Math.floor(vals.length / 2);
    return { year, "Most competitive college": vals[0] ?? null, "Median college": vals.length ? (vals.length % 2 ? vals[mid] : Math.round((vals[mid - 1] + vals[mid]) / 2)) : null, "Least competitive college": vals[vals.length - 1] ?? null };
  });

  const lists: [string, string[]][] = [
    ["Core subjects", branch.subjects],
    ["Career opportunities", branch.careers],
    ["Higher studies", branch.higherStudies],
    ["Typical skills", branch.skills],
  ];

  return (
    <Container className="py-8">
      <nav className="mb-3 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/branches" className="hover:text-primary">Branches</Link> <span className="mx-1">/</span> {branch.shortName}
      </nav>
      <PageHeader title={branch.name} description={`${branch.shortName} · ${humanize(branch.category)} · ${branch.durationYears}-year B.E. programme · KEA branch code ${branch.code}`}>
        <LinkButton href={`/compare/branches?b=${branch.slug}`} variant="secondary" size="sm">
          Compare with other branches
        </LinkButton>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="About the branch" />
            <CardBody className="text-sm text-slate-700">
              <p>{branch.about ?? "Information not available"}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {lists.map(([title, items]) => (
                  <div key={title}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
                    {items.length ? <ul className="mt-1 list-disc pl-5">{items.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="mt-1 text-muted">Information not available</p>}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={`KCET cutoff trend across colleges · ${category}`}
              subtitle="Final-round closing ranks. Lower = more competitive."
              action={
                <AutoSubmitSelect param="category" defaultValue={category} className="h-9 w-40" aria-label="Category">
                  {KCET_CATEGORIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </AutoSubmitSelect>
              }
            />
            <CardBody>
              {overview.length === 0 ? <EmptyState /> : <CutoffTrendChart rows={chartRows} keys={["Most competitive college", "Median college", "Least competitive college"]} />}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={`Colleges offering ${branch.shortName}`} subtitle={`${branch.colleges.length} in the database`} />
            <CardBody className="p-0">
              {branch.colleges.length === 0 ? (
                <EmptyState className="m-4" />
              ) : (
                <ul className="divide-y divide-border">
                  {branch.colleges.map((cb) => {
                    const s = overview.find((o) => o.collegeId === cb.college.id)?.stats;
                    return (
                      <li key={cb.id} className="px-4 py-3 text-sm">
                        <Link href={`/college/${cb.college.slug}/${branch.slug}`} className="font-medium hover:text-primary">
                          {cb.college.name}
                        </Link>
                        {cb.college.isDemo && <DemoBadge className="ml-1" />}
                        <p className="text-xs text-muted">
                          {cb.college.city} · {humanize(cb.college.type)}
                          {cb.intake ? ` · intake ${cb.intake}` : ""}
                          {s?.latest ? ` · ${category} ${s.latest.year}: ${formatRank(s.latest.finalClosing)}` : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader title={`Closing rank by college · ${category}`} subtitle="Sorted by latest closing rank" />
        <CardBody className="p-0">
          {overview.length === 0 ? (
            <EmptyState className="m-4" />
          ) : (
            <div className="scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>College</th>
                    <th>Latest</th>
                    <th>Closing</th>
                    <th>3-yr range</th>
                    <th>Most competitive year</th>
                    <th>Trend</th>
                    {years.slice(-6).map((y) => (
                      <th key={y}>{y}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overview.map((o) => (
                    <tr key={o.collegeId}>
                      <td>
                        <Link href={`/college/${o.college.slug}/${branch.slug}`} className="font-medium text-primary hover:underline">
                          {o.college.shortName ?? o.college.name}
                        </Link>
                        <span className="block text-xs text-muted">{o.college.district}</span>
                      </td>
                      <td>{o.stats.latest?.year}</td>
                      <td className="font-semibold">{formatRank(o.stats.latest?.finalClosing)}</td>
                      <td>
                        {formatRank(o.stats.recentMin)} – {formatRank(o.stats.recentMax)}
                      </td>
                      <td>{o.stats.mostCompetitive ? `${o.stats.mostCompetitive.year} (${formatRank(o.stats.mostCompetitive.finalClosing)})` : "—"}</td>
                      <td>
                        <Badge tone={o.stats.trend === "TIGHTENING" ? "danger" : o.stats.trend === "LOOSENING" ? "success" : "neutral"}>{humanize(o.stats.trend)}</Badge>
                      </td>
                      {years.slice(-6).map((y) => (
                        <td key={y}>{formatRank(o.stats.years.find((yy) => yy.year === y)?.finalClosing)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      <Disclaimer className="mt-8" />
    </Container>
  );
}
