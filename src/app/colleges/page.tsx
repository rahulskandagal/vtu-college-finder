import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDistinctDistricts, listColleges } from "@/lib/data/colleges";
import { collegeListQuery } from "@/lib/validation/student";
import { getSession } from "@/lib/auth/session";
import { CollegeCard } from "@/components/college/college-card";
import { Button, Container, EmptyState, Field, Input, PageHeader, Pagination, Select, LinkButton } from "@/components/ui";
import { COLLEGE_TYPES, FEE_RANGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "College directory",
  description: "Browse VTU-affiliated engineering colleges in Karnataka with filters for district, branch, fees, hostel and placements.",
};
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function CollegesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const parsed = collegeListQuery.safeParse(sp);
  const q = parsed.success ? parsed.data : collegeListQuery.parse({});

  const [data, districts, branches, session] = await Promise.all([
    listColleges(q),
    getDistinctDistricts(),
    prisma.branch.findMany({ select: { slug: true, shortName: true, name: true }, orderBy: { name: "asc" } }),
    getSession(),
  ]);
  const shortlisted = session
    ? new Set((await prisma.shortlist.findMany({ where: { userId: session.id }, select: { collegeId: true } })).map((s) => s.collegeId))
    : new Set<string>();

  const hrefFor = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) p.set(k, v);
    p.set("page", String(page));
    return `/colleges?${p.toString()}`;
  };

  return (
    <Container className="py-8">
      <PageHeader title="College directory" description={`${data.total} college${data.total === 1 ? "" : "s"} match your filters.`}>
        <LinkButton href="/find" variant="secondary" size="sm">
          Find by KCET rank instead
        </LinkButton>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <form method="get" className="h-fit space-y-4 rounded-xl border border-border bg-card p-4 lg:sticky lg:top-20">
          <Field label="Search">
            <Input name="q" defaultValue={q.q ?? ""} placeholder="Name, code, city…" />
          </Field>
          <Field label="District">
            <Select name="district" defaultValue={q.district?.[0] ?? ""}>
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Branch">
            <Select name="branch" defaultValue={q.branch?.[0] ?? ""}>
              <option value="">Any branch</option>
              {branches.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.shortName} — {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="College type">
            <Select name="type" defaultValue={q.type?.[0] ?? ""}>
              <option value="">Any type</option>
              {COLLEGE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Annual fee (KCET quota)">
            <Select name="fee" defaultValue={q.fee ?? ""}>
              <option value="">Any</option>
              {FEE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Hostel">
            <Select name="hostel" defaultValue={q.hostel ?? ""}>
              <option value="">Any</option>
              <option value="yes">Available</option>
              <option value="no">Not available</option>
            </Select>
          </Field>
          <Field label="Minimum placement %">
            <Select name="minPlacement" defaultValue={q.minPlacement !== undefined ? String(q.minPlacement) : ""}>
              <option value="">Any</option>
              <option value="50">50%+</option>
              <option value="70">70%+</option>
              <option value="85">85%+</option>
            </Select>
          </Field>
          <Field label="Sort by">
            <Select name="sort" defaultValue={q.sort}>
              <option value="name">Name</option>
              <option value="cutoff">GM cutoff (most competitive first)</option>
              <option value="fee">Fee (low to high)</option>
              <option value="placement">Placement %</option>
              <option value="established">Established year</option>
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Apply filters
            </Button>
            <LinkButton href="/colleges" variant="outline">
              Reset
            </LinkButton>
          </div>
        </form>

        <div>
          {data.items.length === 0 ? (
            <EmptyState title="No colleges match" description="Try widening your filters." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((c) => (
                <CollegeCard key={c.id} college={c} shortlisted={shortlisted.has(c.id)} />
              ))}
            </div>
          )}
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={hrefFor} />
        </div>
      </div>
    </Container>
  );
}
