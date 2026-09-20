import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { CollegeType } from "@/generated/prisma/enums";
import { FEE_RANGES } from "@/lib/constants";
import type { CollegeListQuery } from "@/lib/validation/student";

export type CollegeCardData = {
  id: string;
  slug: string;
  code: string;
  name: string;
  shortName: string | null;
  district: string;
  city: string;
  type: string;
  establishedYear: number | null;
  autonomous: boolean;
  accreditation: string[];
  hostelAvailable: boolean;
  imageUrl: string | null;
  isDemo: boolean;
  popularBranches: { slug: string; shortName: string; name: string }[];
  /** Best (lowest) GM final-round closing rank in the latest year with data. */
  bestGmCutoff: { closingRank: number; year: number; branch: string } | null;
  /** Latest KCET-quota annual tuition (college-wide or first branch fee). */
  latestFee: { year: number; total: number } | null;
  latestPlacement: { year: number; percent: number | null; average: number | null; highest: number | null } | null;
};

const cardSelect = {
  id: true,
  slug: true,
  code: true,
  name: true,
  shortName: true,
  district: true,
  city: true,
  type: true,
  establishedYear: true,
  autonomous: true,
  accreditation: true,
  hostelAvailable: true,
  imageUrl: true,
  isDemo: true,
  branches: { select: { branch: { select: { slug: true, shortName: true, name: true, category: true } } } },
} satisfies Prisma.CollegeSelect;

type CardRow = Prisma.CollegeGetPayload<{ select: typeof cardSelect }>;

/** Enrich a set of college rows with latest cutoff / fee / placement summaries. */
export async function buildCards(rows: CardRow[]): Promise<CollegeCardData[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [latestYear, fees, placements] = await Promise.all([
    prisma.cutoff.aggregate({ _max: { year: true }, where: { collegeId: { in: ids }, category: "GM" } }),
    prisma.fee.findMany({
      where: { collegeId: { in: ids }, quota: "KCET" },
      orderBy: [{ year: "desc" }, { branchId: "asc" }],
      select: { collegeId: true, year: true, tuitionFee: true, universityFee: true, examFee: true, otherFee: true, branchId: true },
    }),
    prisma.placement.findMany({
      where: { collegeId: { in: ids }, departmentId: null },
      orderBy: { year: "desc" },
      select: { collegeId: true, year: true, placementPercent: true, averagePackage: true, highestPackage: true },
    }),
  ]);

  const year = latestYear._max.year;
  const cutoffs = year
    ? await prisma.cutoff.findMany({
        where: { collegeId: { in: ids }, category: "GM", gender: "ALL", seatType: "GENERAL", year },
        select: { collegeId: true, branchId: true, round: true, closingRank: true, branch: { select: { shortName: true, slug: true } } },
      })
    : [];

  // final-round closing per (college, branch)
  const finalByCollegeBranch = new Map<string, { round: number; closingRank: number; branch: string; slug: string }>();
  for (const c of cutoffs) {
    const key = `${c.collegeId}|${c.branchId}`;
    const cur = finalByCollegeBranch.get(key);
    if (!cur || c.round > cur.round)
      finalByCollegeBranch.set(key, { round: c.round, closingRank: c.closingRank, branch: c.branch.shortName, slug: c.branch.slug });
  }

  const feeByCollege = new Map<string, { year: number; total: number }>();
  for (const f of fees) {
    if (!feeByCollege.has(f.collegeId))
      feeByCollege.set(f.collegeId, { year: f.year, total: f.tuitionFee + f.universityFee + f.examFee + f.otherFee });
  }
  const placementByCollege = new Map<string, CollegeCardData["latestPlacement"]>();
  for (const p of placements) {
    if (!placementByCollege.has(p.collegeId))
      placementByCollege.set(p.collegeId, {
        year: p.year,
        percent: p.placementPercent,
        average: p.averagePackage,
        highest: p.highestPackage,
      });
  }

  return rows.map((r) => {
    let best: CollegeCardData["bestGmCutoff"] = null;
    const branchCutoffs: { slug: string; closingRank: number }[] = [];
    for (const [key, v] of finalByCollegeBranch) {
      if (!key.startsWith(r.id + "|")) continue;
      branchCutoffs.push({ slug: v.slug, closingRank: v.closingRank });
      if (!best || v.closingRank < best.closingRank) best = { closingRank: v.closingRank, year: year!, branch: v.branch };
    }
    // popular = branches with the most competitive cutoffs; fallback to computing branches first
    const rank = new Map(branchCutoffs.map((b) => [b.slug, b.closingRank]));
    const popularBranches = [...r.branches]
      .map((b) => b.branch)
      .sort((a, b) => {
        const ra = rank.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
        const rb = rank.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
        if (ra !== rb) return ra - rb;
        return a.category === "COMPUTING" ? -1 : b.category === "COMPUTING" ? 1 : a.name.localeCompare(b.name);
      })
      .slice(0, 4)
      .map(({ slug, shortName, name }) => ({ slug, shortName, name }));

    return {
      id: r.id,
      slug: r.slug,
      code: r.code,
      name: r.name,
      shortName: r.shortName,
      district: r.district,
      city: r.city,
      type: r.type,
      establishedYear: r.establishedYear,
      autonomous: r.autonomous,
      accreditation: r.accreditation,
      hostelAvailable: r.hostelAvailable,
      imageUrl: r.imageUrl,
      isDemo: r.isDemo,
      popularBranches,
      bestGmCutoff: best,
      latestFee: feeByCollege.get(r.id) ?? null,
      latestPlacement: placementByCollege.get(r.id) ?? null,
    };
  });
}

export async function listColleges(q: CollegeListQuery) {
  const where: Prisma.CollegeWhereInput = {};
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { shortName: { contains: q.q, mode: "insensitive" } },
      { code: { contains: q.q, mode: "insensitive" } },
      { city: { contains: q.q, mode: "insensitive" } },
      { district: { contains: q.q, mode: "insensitive" } },
    ];
  }
  if (q.district?.length) where.district = { in: q.district };
  if (q.type?.length) where.type = { in: q.type as CollegeType[] };
  if (q.branch?.length) where.branches = { some: { branch: { slug: { in: q.branch } } } };
  if (q.hostel === "yes") where.hostelAvailable = true;
  if (q.hostel === "no") where.hostelAvailable = false;
  if (q.minPlacement !== undefined)
    where.placements = { some: { departmentId: null, placementPercent: { gte: q.minPlacement } } };

  const rows = await prisma.college.findMany({ where, select: cardSelect, orderBy: { name: "asc" } });
  let cards = await buildCards(rows);

  if (q.fee) {
    const range = FEE_RANGES.find((r) => r.value === q.fee);
    if (range) cards = cards.filter((c) => c.latestFee && c.latestFee.total >= range.min && c.latestFee.total < range.max);
  }

  const inf = Number.MAX_SAFE_INTEGER;
  switch (q.sort) {
    case "cutoff":
      cards.sort((a, b) => (a.bestGmCutoff?.closingRank ?? inf) - (b.bestGmCutoff?.closingRank ?? inf));
      break;
    case "fee":
      cards.sort((a, b) => (a.latestFee?.total ?? inf) - (b.latestFee?.total ?? inf));
      break;
    case "placement":
      cards.sort((a, b) => (b.latestPlacement?.percent ?? -1) - (a.latestPlacement?.percent ?? -1));
      break;
    case "established":
      cards.sort((a, b) => (a.establishedYear ?? 9999) - (b.establishedYear ?? 9999));
      break;
    default:
      cards.sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = cards.length;
  const start = (q.page - 1) * q.pageSize;
  return { items: cards.slice(start, start + q.pageSize), total, page: q.page, pageSize: q.pageSize };
}

export async function getCardsByIds(ids: string[]) {
  const rows = await prisma.college.findMany({ where: { id: { in: ids } }, select: cardSelect });
  const cards = await buildCards(rows);
  const order = new Map(ids.map((id, i) => [id, i]));
  return cards.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getCardsBySlugs(slugs: string[]) {
  const rows = await prisma.college.findMany({ where: { slug: { in: slugs } }, select: cardSelect });
  return buildCards(rows);
}

export const collegeProfileInclude = {
  source: true,
  departments: { orderBy: { name: "asc" }, include: { source: true } },
  branches: { include: { branch: true, department: { select: { id: true, name: true, slug: true } } } },
  fees: { orderBy: [{ year: "desc" }, { quota: "asc" }], include: { branch: { select: { shortName: true, name: true } }, source: true } },
  faculty: { orderBy: { name: "asc" }, include: { department: { select: { name: true } }, source: true } },
  facilities: { orderBy: { category: "asc" }, include: { source: true } },
  laboratories: { orderBy: { name: "asc" }, include: { department: { select: { name: true } }, source: true } },
  hostels: { include: { source: true } },
  placements: { orderBy: { year: "desc" }, include: { department: { select: { name: true } }, source: true } },
  recruiters: { include: { recruiter: true } },
  events: { orderBy: [{ year: "desc" }, { date: "desc" }], include: { department: { select: { name: true } }, source: true } },
  hackathons: { orderBy: { year: "desc" }, include: { source: true } },
  clubs: { orderBy: { name: "asc" }, include: { department: { select: { name: true } }, source: true } },
  achievements: { orderBy: { year: "desc" }, include: { source: true } },
  milestones: { orderBy: { year: "asc" }, include: { source: true } },
  images: true,
} satisfies Prisma.CollegeInclude;

export type CollegeProfile = Prisma.CollegeGetPayload<{ include: typeof collegeProfileInclude }>;

export async function getCollegeBySlug(slug: string): Promise<CollegeProfile | null> {
  return prisma.college.findFirst({
    where: { OR: [{ slug }, { code: slug.toUpperCase() }] },
    include: collegeProfileInclude,
  });
}

export async function getAllCollegeSlugs() {
  return prisma.college.findMany({ select: { slug: true, updatedAt: true, branches: { select: { branch: { select: { slug: true } } } } } });
}

export async function getDistinctDistricts() {
  const rows = await prisma.college.findMany({ select: { district: true }, distinct: ["district"], orderBy: { district: "asc" } });
  return rows.map((r) => r.district);
}
