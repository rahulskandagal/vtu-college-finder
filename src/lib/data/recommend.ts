import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { CollegeType } from "@/generated/prisma/enums";
import { classifyRank, GROUP_META, type CutoffPoint, type EligibilityGroup, type CutoffStats } from "@/lib/cutoff-engine";
import type { RecommendInput } from "@/lib/validation/student";

export type RecommendationItem = {
  college: {
    id: string;
    slug: string;
    code: string;
    name: string;
    district: string;
    city: string;
    type: string;
    hostelAvailable: boolean;
    isDemo: boolean;
  };
  branch: { id: string; slug: string; shortName: string; name: string };
  group: EligibilityGroup;
  reason: string;
  categoryUsed: string;
  usedFallbackCategory: boolean;
  stats: CutoffStats;
  latestFee: { year: number; total: number } | null;
  latestPlacement: { year: number; percent: number | null; average: number | null } | null;
  sources: { name: string; url: string | null; year: number | null; isDemo: boolean }[];
};

export type RecommendationResult = {
  input: RecommendInput;
  groups: { group: EligibilityGroup; label: string; description: string; items: RecommendationItem[] }[];
  totalConsidered: number;
  yearsConsidered: number[];
};

export async function recommendColleges(input: RecommendInput): Promise<RecommendationResult> {
  const collegeWhere: Prisma.CollegeWhereInput = {};
  if (input.districts.length) collegeWhere.district = { in: input.districts };
  if (input.collegeTypes.length) collegeWhere.type = { in: input.collegeTypes as CollegeType[] };
  if (input.hostelRequired) collegeWhere.hostelAvailable = true;

  const branchWhere: Prisma.BranchWhereInput = input.branches.length ? { slug: { in: input.branches } } : {};

  const cutoffWhere: Prisma.CutoffWhereInput = {
    college: collegeWhere,
    branch: branchWhere,
    gender: { in: input.gender === "ALL" ? ["ALL"] : ["ALL", input.gender] },
    seatType: "GENERAL",
    category: { in: input.category === "GM" ? ["GM"] : [input.category, "GM"] },
    ...(input.years?.length ? { year: { in: input.years } } : {}),
  };

  const rows = await prisma.cutoff.findMany({
    where: cutoffWhere,
    select: {
      collegeId: true,
      branchId: true,
      year: true,
      round: true,
      category: true,
      gender: true,
      openingRank: true,
      closingRank: true,
      college: { select: { id: true, slug: true, code: true, name: true, district: true, city: true, type: true, hostelAvailable: true, isDemo: true } },
      branch: { select: { id: true, slug: true, shortName: true, name: true } },
      source: { select: { name: true, url: true, publicationYear: true, isDemo: true } },
    },
  });

  // Group by (college, branch); prefer the requested category, fall back to GM.
  type Bucket = {
    college: RecommendationItem["college"];
    branch: RecommendationItem["branch"];
    byCategory: Map<string, CutoffPoint[]>;
    sources: Map<string, RecommendationItem["sources"][number]>;
  };
  const buckets = new Map<string, Bucket>();
  const years = new Set<number>();
  for (const r of rows) {
    years.add(r.year);
    const key = `${r.collegeId}|${r.branchId}`;
    let b = buckets.get(key);
    if (!b) {
      b = { college: r.college, branch: r.branch, byCategory: new Map(), sources: new Map() };
      buckets.set(key, b);
    }
    if (!b.byCategory.has(r.category)) b.byCategory.set(r.category, []);
    b.byCategory.get(r.category)!.push({ year: r.year, round: r.round, category: r.category, openingRank: r.openingRank, closingRank: r.closingRank });
    if (r.source) b.sources.set(r.source.name, { name: r.source.name, url: r.source.url, year: r.source.publicationYear, isDemo: r.source.isDemo });
  }

  const collegeIds = Array.from(new Set(rows.map((r) => r.collegeId)));
  const [fees, placements] = await Promise.all([
    prisma.fee.findMany({
      where: { collegeId: { in: collegeIds }, quota: "KCET" },
      orderBy: [{ year: "desc" }],
      select: { collegeId: true, branchId: true, year: true, tuitionFee: true, universityFee: true, examFee: true, otherFee: true },
    }),
    prisma.placement.findMany({
      where: { collegeId: { in: collegeIds }, departmentId: null },
      orderBy: { year: "desc" },
      select: { collegeId: true, year: true, placementPercent: true, averagePackage: true },
    }),
  ]);
  const feeFor = (collegeId: string, branchId: string) => {
    const f = fees.find((x) => x.collegeId === collegeId && (x.branchId === branchId || x.branchId === null));
    return f ? { year: f.year, total: f.tuitionFee + f.universityFee + f.examFee + f.otherFee } : null;
  };
  const placementFor = (collegeId: string) => {
    const p = placements.find((x) => x.collegeId === collegeId);
    return p ? { year: p.year, percent: p.placementPercent, average: p.averagePackage } : null;
  };

  const items: RecommendationItem[] = [];
  for (const b of buckets.values()) {
    const preferred = b.byCategory.get(input.category);
    const points = preferred?.length ? preferred : b.byCategory.get("GM") ?? [];
    const usedFallback = !preferred?.length && input.category !== "GM";
    if (!points.length) continue;
    const cls = classifyRank(input.rank, points);
    const latestFee = feeFor(b.college.id, b.branch.id);
    if (input.maxFee !== undefined && latestFee && latestFee.total > input.maxFee) continue;
    items.push({
      college: b.college,
      branch: b.branch,
      group: cls.group,
      reason: cls.reason,
      categoryUsed: usedFallback ? "GM" : input.category,
      usedFallbackCategory: usedFallback,
      stats: cls.stats,
      latestFee,
      latestPlacement: placementFor(b.college.id),
      sources: Array.from(b.sources.values()),
    });
  }

  // Within a group, order by how close the rank is to the recent closing range,
  // with an optional nudge towards stronger placement records.
  const w = (input.placementImportance - 3) * 0.05;
  items.sort((a, b) => {
    const da = (a.stats.recentAverage ?? 0) - (b.stats.recentAverage ?? 0);
    const pa = (a.latestPlacement?.percent ?? 0) - (b.latestPlacement?.percent ?? 0);
    return da * (1 - Math.abs(w)) - pa * w * 100;
  });

  const groupOrder = (Object.keys(GROUP_META) as EligibilityGroup[]).sort((a, b) => GROUP_META[a].order - GROUP_META[b].order);
  const groups = groupOrder
    .map((g) => ({ group: g, label: GROUP_META[g].label, description: GROUP_META[g].description, items: items.filter((i) => i.group === g) }))
    .filter((g) => g.items.length > 0);

  return { input, groups, totalConsidered: items.length, yearsConsidered: Array.from(years).sort((a, b) => b - a) };
}
