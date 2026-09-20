import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCollegeCutoffs } from "@/lib/data/cutoffs";
import { toCompact } from "@/components/college/profile/cutoffs";
import { CutoffExplorer } from "@/components/charts/cutoff-explorer";
import { formatINR, humanize } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, Container, DemoBadge, DemoBanner, Disclaimer, EmptyState, LinkButton, SourceNote } from "@/components/ui";

export const dynamic = "force-dynamic";
type Params = { slug: string; branch: string };

async function load(slug: string, branchSlug: string) {
  const college = await prisma.college.findFirst({ where: { OR: [{ slug }, { code: slug.toUpperCase() }] }, select: { id: true, slug: true, name: true, shortName: true, city: true, district: true, isDemo: true } });
  if (!college) return null;
  const cb = await prisma.collegeBranch.findFirst({
    where: { collegeId: college.id, branch: { OR: [{ slug: branchSlug }, { code: branchSlug.toUpperCase() }, { shortName: branchSlug.toUpperCase() }] } },
    include: {
      branch: true,
      department: { include: { faculty: { orderBy: { name: "asc" }, include: { source: true } }, laboratories: { orderBy: { name: "asc" }, include: { source: true } }, clubs: true, events: { orderBy: { year: "desc" }, take: 10 }, placements: { orderBy: { year: "desc" } } } },
    },
  });
  if (!cb) return null;
  return { college, cb };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, branch } = await params;
  const data = await load(slug, branch);
  if (!data) return { title: "Not found" };
  return {
    title: `${data.cb.branch.shortName} at ${data.college.shortName ?? data.college.name} — KCET cutoff, fees, labs`,
    description: `${data.cb.branch.name} at ${data.college.name}: historical KCET cutoffs, fees, laboratories, faculty and placement information.`,
    alternates: { canonical: `/college/${data.college.slug}/${data.cb.branch.slug}` },
  };
}

export default async function CollegeBranchPage({ params }: { params: Promise<Params> }) {
  const { slug, branch } = await params;
  const data = await load(slug, branch);
  if (!data) notFound();
  const { college, cb } = data;
  const [cutoffs, fees] = await Promise.all([
    getCollegeCutoffs(college.id, cb.branchId),
    prisma.fee.findMany({ where: { collegeId: college.id, OR: [{ branchId: cb.branchId }, { branchId: null }] }, orderBy: [{ year: "desc" }, { quota: "asc" }], include: { source: true } }),
  ]);
  const dept = cb.department;

  return (
    <Container className="py-8">
      <nav className="mb-3 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/colleges" className="hover:text-primary">Colleges</Link> <span className="mx-1">/</span>
        <Link href={`/college/${college.slug}`} className="hover:text-primary">{college.shortName ?? college.name}</Link> <span className="mx-1">/</span> {cb.branch.shortName}
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{cb.branch.name}</h1>
          <p className="mt-1 text-sm text-muted">
            at <Link href={`/college/${college.slug}`} className="text-primary hover:underline">{college.name}</Link>, {college.city} · {cb.branch.durationYears} years · {humanize(cb.branch.category)}
            {dept && <> · {dept.name}</>}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {cb.intake && <Badge>Intake {cb.intake}</Badge>}
            {cb.nbaAccredited && <Badge tone="accent">NBA accredited</Badge>}
            {cb.startedYear && <Badge>Since {cb.startedYear}</Badge>}
            {cb.isDemo && <DemoBadge />}
          </div>
        </div>
        <LinkButton href={`/branches/${cb.branch.slug}`} variant="outline" size="sm">
          About {cb.branch.shortName} in general
        </LinkButton>
      </div>
      {college.isDemo && <DemoBanner className="mt-4" />}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-lg font-semibold">KCET cutoff history</h2>
            {cutoffs.length === 0 ? <EmptyState title="No cutoff records for this branch" /> : <CutoffExplorer rows={toCompact(cutoffs)} fixedBranch={cb.branch.slug} title={`${college.shortName ?? college.name} ${cb.branch.shortName}`} />}
          </section>

          <Card>
            <CardHeader title="About the branch" />
            <CardBody className="text-sm text-slate-700">
              <p>{cb.branch.about ?? "Information not available"}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Core subjects</p>
                  <ul className="mt-1 list-disc pl-5">{cb.branch.subjects.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Career opportunities</p>
                  <ul className="mt-1 list-disc pl-5">{cb.branch.careers.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Higher studies</p>
                  <ul className="mt-1 list-disc pl-5">{cb.branch.higherStudies.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Typical skills</p>
                  <ul className="mt-1 list-disc pl-5">{cb.branch.skills.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Laboratories" subtitle={dept ? dept.name : undefined} />
            <CardBody>
              {!dept || dept.laboratories.length === 0 ? (
                <EmptyState />
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {dept.laboratories.map((l) => (
                    <li key={l.id} className="rounded-lg border border-border p-3 text-sm">
                      <p className="font-medium">{l.name} {l.isDemo && <DemoBadge className="ml-1" />}</p>
                      <p className="text-xs text-muted">{l.purpose ?? "Information not available"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Faculty" subtitle={dept ? `${dept.name}${dept.hod ? ` · HoD: ${dept.hod}` : ""}` : undefined} />
            <CardBody className="p-0">
              {!dept || dept.faculty.length === 0 ? (
                <EmptyState className="m-4" title="Faculty information currently unavailable" />
              ) : (
                <div className="scroll-x">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Qualification</th>
                        <th>Specialization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dept.faculty.map((f) => (
                        <tr key={f.id}>
                          <td className="font-medium">{f.name}</td>
                          <td>{f.designation ?? "Information not available"}</td>
                          <td>{f.qualification ?? "Information not available"}</td>
                          <td>{f.specialization ?? "Information not available"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Fees" subtitle="Branch-specific if published, else college-wide" />
            <CardBody className="p-0">
              {fees.length === 0 ? (
                <EmptyState className="m-4" />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Quota</th>
                      <th>Total / yr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.slice(0, 12).map((f) => (
                      <tr key={f.id}>
                        <td>{f.year}</td>
                        <td>{f.quota}</td>
                        <td className="font-semibold">
                          {formatINR(f.tuitionFee + f.universityFee + f.examFee + f.otherFee)} {f.isDemo && <DemoBadge className="ml-1" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="px-4 py-3">
                <SourceNote source={fees[0]?.source} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Department placements" />
            <CardBody>
              {!dept || dept.placements.length === 0 ? (
                <EmptyState title="Department-wise placement data currently unavailable" description="See the college Placements tab for college-wide figures." />
              ) : (
                <ul className="space-y-1 text-sm">
                  {dept.placements.map((p) => (
                    <li key={p.id} className="flex justify-between">
                      <span>{p.year}</span>
                      <span>{p.placementPercent != null ? `${p.placementPercent}%` : "—"} · avg {p.averagePackage ?? "—"} LPA</span>
                    </li>
                  ))}
                </ul>
              )}
              <LinkButton href={`/college/${college.slug}?tab=placements`} variant="ghost" size="sm" className="mt-3">
                College placements →
              </LinkButton>
            </CardBody>
          </Card>

          {dept && dept.clubs.length > 0 && (
            <Card>
              <CardHeader title="Department clubs" />
              <CardBody>
                <ul className="list-disc pl-5 text-sm">{dept.clubs.map((c) => <li key={c.id}>{c.name}</li>)}</ul>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
      <Disclaimer className="mt-8" />
    </Container>
  );
}
