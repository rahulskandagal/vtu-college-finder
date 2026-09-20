import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCollegeCutoffs, getCutoffFilterOptions, queryCutoffs } from "@/lib/data/cutoffs";
import { cutoffQuery } from "@/lib/validation/student";
import { toCompact } from "@/components/college/profile/cutoffs";
import { CutoffExplorer } from "@/components/charts/cutoff-explorer";
import { Button, Container, DemoBadge, Disclaimer, EmptyState, Field, Input, LinkButton, PageHeader, Pagination, Select } from "@/components/ui";
import { formatRank, humanize } from "@/lib/utils";

export const metadata: Metadata = {
  title: "KCET cutoff explorer",
  description: "Search ten years of KCET opening and closing ranks by college, branch, category, round and year.",
};
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function CutoffsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const parsed = cutoffQuery.safeParse(sp);
  const q = parsed.success ? parsed.data : cutoffQuery.parse({});

  const [options, colleges, branches] = await Promise.all([
    getCutoffFilterOptions(),
    prisma.college.findMany({ select: { slug: true, name: true, shortName: true }, orderBy: { name: "asc" } }),
    prisma.branch.findMany({ select: { slug: true, shortName: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  // When one college is chosen, show the interactive explorer with charts.
  const selectedCollege = q.college ? await prisma.college.findFirst({ where: { OR: [{ slug: q.college }, { code: q.college.toUpperCase() }] }, select: { id: true, slug: true, name: true, shortName: true } }) : null;
  const explorerRows = selectedCollege ? toCompact(await getCollegeCutoffs(selectedCollege.id)) : null;

  const table = !selectedCollege ? await queryCutoffs(q) : null;
  const hrefFor = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) p.set(k, v);
    p.set("page", String(page));
    return `/cutoffs?${p.toString()}`;
  };

  return (
    <Container className="py-8">
      <PageHeader title="KCET cutoff explorer" description="Historical opening and closing ranks for every college, branch, category and counselling round in the database. Pick a college to see trend charts and year-by-year statistics.">
        <LinkButton href="/find" variant="secondary" size="sm">
          Find colleges for my rank
        </LinkButton>
      </PageHeader>

      <form method="get" className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="College" className="lg:col-span-2">
          <Select name="college" defaultValue={q.college ?? ""}>
            <option value="">All colleges (table view)</option>
            {colleges.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.shortName ? `${c.shortName} — ` : ""}{c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Branch">
          <Select name="branch" defaultValue={q.branch ?? ""}>
            <option value="">Any</option>
            {branches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.shortName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Year">
          <Select name="year" defaultValue={q.year ? String(q.year) : ""}>
            <option value="">Any</option>
            {options.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Category">
          <Select name="category" defaultValue={q.category ?? ""}>
            <option value="">Any</option>
            {options.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Round">
          <Select name="round" defaultValue={q.round ? String(q.round) : ""}>
            <option value="">Any</option>
            {options.rounds.map((r) => (
              <option key={r} value={r}>
                Round {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Closing rank ≤">
          <Input name="maxRank" inputMode="numeric" defaultValue={q.maxRank ?? ""} placeholder="e.g. 20000" />
        </Field>
        <Field label="Closing rank ≥">
          <Input name="minRank" inputMode="numeric" defaultValue={q.minRank ?? ""} placeholder="e.g. 5000" />
        </Field>
        <div className="flex items-end gap-2 lg:col-span-2">
          <Button type="submit" className="flex-1">
            Apply
          </Button>
          <LinkButton href="/cutoffs" variant="outline">
            Reset
          </LinkButton>
        </div>
      </form>

      {selectedCollege && explorerRows && (
        <>
          <h2 className="mb-3 text-lg font-semibold">
            <Link href={`/college/${selectedCollege.slug}`} className="hover:text-primary">{selectedCollege.name}</Link>
          </h2>
          {explorerRows.length === 0 ? <EmptyState /> : <CutoffExplorer rows={explorerRows} fixedBranch={q.branch && explorerRows.some((r) => r.b === q.branch) ? q.branch : undefined} title={selectedCollege.shortName ?? selectedCollege.name} />}
        </>
      )}

      {table && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
            <span className="font-semibold">{table.total.toLocaleString("en-IN")} cutoff records</span>
            <span className="text-muted">Sorted by year (newest), round, closing rank</span>
          </div>
          {table.items.length === 0 ? (
            <EmptyState className="m-4" title="No cutoff records match" />
          ) : (
            <div className="scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>College</th>
                    <th>Branch</th>
                    <th>Year</th>
                    <th>Round</th>
                    <th>Category</th>
                    <th>Gender</th>
                    <th>Seat type</th>
                    <th>Opening</th>
                    <th>Closing</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {table.items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/college/${r.college.slug}?tab=cutoffs`} className="font-medium text-primary hover:underline">
                          {r.college.name}
                        </Link>
                        <span className="block text-xs text-muted">{r.college.district} · {r.college.code}</span>
                      </td>
                      <td>
                        <Link href={`/college/${r.college.slug}/${r.branch.slug}`} className="hover:underline">
                          {r.branch.shortName}
                        </Link>
                      </td>
                      <td>{r.year}</td>
                      <td>{r.round}</td>
                      <td className="font-medium">{r.category}</td>
                      <td>{r.gender}</td>
                      <td>{humanize(r.seatType)}</td>
                      <td>{formatRank(r.openingRank)}</td>
                      <td className="font-semibold">{formatRank(r.closingRank)}</td>
                      <td className="text-xs">
                        {r.source?.name ?? "—"} {r.isDemo && <DemoBadge className="ml-1" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 pb-4">
            <Pagination page={table.page} pageSize={table.pageSize} total={table.total} hrefFor={hrefFor} />
          </div>
        </div>
      )}
      <Disclaimer className="mt-8" />
    </Container>
  );
}
