import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ImportForm } from "@/components/admin/import-form";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui";
import { SAMPLE_CSV } from "@/lib/import/cutoffs";

export const metadata: Metadata = { title: "Import cutoffs" };

export default async function ImportPage() {
  const sources = await prisma.source.findMany({ select: { id: true, name: true, isDemo: true }, orderBy: { name: "asc" } });
  const branches = await prisma.branch.findMany({ select: { code: true, shortName: true, slug: true }, orderBy: { code: "asc" } });
  return (
    <div>
      <PageHeader title="Import cutoffs" description="Upload a CSV or Excel file. Every file is validated first (missing fields, invalid ranks/years, unknown college codes, duplicates) and nothing is written until you confirm." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ImportForm sources={sources} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Expected columns" />
            <CardBody className="text-sm">
              <p className="mb-2">Header names are case-insensitive. Required:</p>
              <code className="block rounded bg-slate-50 p-2 text-xs">college_code, branch, year, category, closing_rank</code>
              <p className="mb-2 mt-3">Optional:</p>
              <code className="block rounded bg-slate-50 p-2 text-xs">college_name, round (default 1), gender (ALL/MALE/FEMALE), seat_type (GENERAL/HK/RURAL/KANNADA_MEDIUM/SNQ), opening_rank</code>
              <p className="mt-3 text-xs text-muted">
                <strong>branch</strong> accepts the KEA code ({branches.slice(0, 4).map((b) => b.code).join(", ")}…), the short name (CSE, ISE…) or the slug.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Sample CSV" />
            <CardBody>
              <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-[11px] leading-relaxed">{SAMPLE_CSV}</pre>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
