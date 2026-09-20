import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { recommendColleges } from "@/lib/data/recommend";
import { recommendSchema } from "@/lib/validation/student";
import { RankForm } from "@/components/college/rank-form";
import { RecommendationResults } from "@/components/college/recommendation-results";
import { Container, Disclaimer, PageHeader } from "@/components/ui";
import { KCET_CATEGORIES } from "@/lib/constants";
import { formatRank } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Find colleges for your KCET rank",
  description: "Enter your KCET rank, category and preferences to see which VTU engineering colleges and branches match historical cutoffs.",
};
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) => (one(v) ? one(v)!.split(",").filter(Boolean) : []);

export default async function FindPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const branches = await prisma.branch.findMany({ select: { slug: true, shortName: true, name: true }, orderBy: [{ category: "asc" }, { name: "asc" }] });

  const rawRank = one(sp.rank);
  const parsed = rawRank
    ? recommendSchema.safeParse({
        rank: rawRank,
        category: one(sp.category) ?? "GM",
        gender: one(sp.gender) ?? "ALL",
        branches: list(sp.branches),
        districts: list(sp.districts),
        collegeTypes: list(sp.types),
        maxFee: one(sp.maxFee) || undefined,
        hostelRequired: one(sp.hostel) === "1",
        placementImportance: one(sp.placement) ?? 3,
      })
    : null;

  const result = parsed?.success ? await recommendColleges(parsed.data) : null;

  const initial = {
    rank: rawRank ?? "",
    category: one(sp.category) ?? "GM",
    gender: one(sp.gender) ?? "ALL",
    branches: list(sp.branches),
    districts: list(sp.districts),
    collegeTypes: list(sp.types),
    maxFee: one(sp.maxFee) ?? "",
    hostelRequired: one(sp.hostel) === "1",
    placementImportance: one(sp.placement) ?? "3",
  };

  return (
    <Container className="py-8">
      <PageHeader
        title="Find colleges for your KCET rank"
        description="Colleges and branches are grouped by how your rank compares with the last three years of final-round closing ranks. This is research guidance, not a prediction."
      />

      {!result && (
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          {parsed && !parsed.success && <p className="mb-4 text-sm text-danger">Some inputs were invalid — please check the form.</p>}
          <RankForm branches={branches} initial={initial} />
        </div>
      )}

      {result && (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">
            <span>
              Rank <strong>{formatRank(result.input.rank)}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Category <strong>{KCET_CATEGORIES.find((c) => c.code === result.input.category)?.label ?? result.input.category}</strong>
            </span>
            {result.input.branches.length > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span>Branches: {result.input.branches.map((s) => branches.find((b) => b.slug === s)?.shortName ?? s).join(", ")}</span>
              </>
            )}
            {result.input.districts.length > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span>Districts: {result.input.districts.join(", ")}</span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-muted">Years considered: {result.yearsConsidered.slice(0, 3).join(", ")}</span>
          </div>
          <details className="mb-6 rounded-xl border border-border bg-card" open={false}>
            <summary className="cursor-pointer px-5 py-3 text-sm font-medium">Edit rank & preferences</summary>
            <div className="border-t border-border p-5">
              <RankForm branches={branches} initial={initial} />
            </div>
          </details>

          <Disclaimer className="mb-6" />
          <RecommendationResults
            result={result}
            limit={one(sp.all) === "1" ? 500 : 40}
            showAllHref={one(sp.all) === "1" ? undefined : `/find?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]), all: "1" }).toString()}`}
          />
          <p className="mt-8 text-sm text-muted">
            Want the underlying numbers? Open the <Link href="/cutoffs" className="text-primary hover:underline">cutoff explorer</Link> to see every round and category for any college.
          </p>
        </>
      )}
    </Container>
  );
}
