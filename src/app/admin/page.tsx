import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, EmptyState, LinkButton, PageHeader, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminHome() {
  const [colleges, branches, cutoffs, demoCutoffs, fees, faculty, events, clubs, users, sources, pendingReviews, imports] = await Promise.all([
    prisma.college.count(),
    prisma.branch.count(),
    prisma.cutoff.count(),
    prisma.cutoff.count({ where: { isDemo: true } }),
    prisma.fee.count(),
    prisma.faculty.count(),
    prisma.event.count(),
    prisma.club.count(),
    prisma.user.count(),
    prisma.source.count(),
    prisma.collegeReview.count({ where: { approved: false } }),
    prisma.importLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } }),
  ]);

  return (
    <div>
      <PageHeader title="Admin dashboard" description="Manage colleges, branches, cutoffs, fees, faculty, events, clubs, facilities and data sources.">
        <LinkButton href="/admin/import" size="sm">
          Import cutoffs
        </LinkButton>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Colleges" value={colleges} hint={<Link href="/admin/colleges" className="text-primary">Manage</Link>} />
        <Stat label="Branches" value={branches} hint={<Link href="/admin/branches" className="text-primary">Manage</Link>} />
        <Stat label="Cutoff records" value={cutoffs.toLocaleString("en-IN")} hint={demoCutoffs ? `${demoCutoffs.toLocaleString("en-IN")} flagged demo` : "all verified"} />
        <Stat label="Fee records" value={fees} />
        <Stat label="Faculty" value={faculty} />
        <Stat label="Events" value={events} />
        <Stat label="Clubs" value={clubs} />
        <Stat label="Users" value={users} hint={`${sources} sources · ${pendingReviews} reviews pending`} />
      </div>

      {demoCutoffs > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-warning-soft px-4 py-3 text-sm text-amber-900">
          {demoCutoffs.toLocaleString("en-IN")} cutoff rows are flagged as demo data. Replace them with verified KEA records via <Link href="/admin/import" className="underline">CSV import</Link> (attach a Source and leave “demo” unchecked), then delete demo rows from <Link href="/admin/cutoffs" className="underline">Cutoffs</Link>.
        </div>
      )}

      <Card className="mt-6">
        <CardHeader title="Recent imports" />
        <CardBody className="p-0">
          {imports.length === 0 ? (
            <EmptyState className="m-4" title="No imports yet" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>File</th>
                  <th>By</th>
                  <th>Rows</th>
                  <th>Imported</th>
                  <th>Skipped</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((i) => (
                  <tr key={i.id}>
                    <td>{formatDate(i.createdAt)}</td>
                    <td className="font-medium">{i.filename}</td>
                    <td>{i.user.name}</td>
                    <td>{i.rowsTotal}</td>
                    <td>{i.rowsImported}</td>
                    <td>{i.rowsSkipped}</td>
                    <td>
                      <Badge tone={i.status === "SUCCESS" ? "success" : i.status === "PARTIAL" ? "warning" : "danger"}>{i.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
