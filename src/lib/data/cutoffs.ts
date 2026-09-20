import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { computeStats, type CutoffPoint } from "@/lib/cutoff-engine";
import type { z } from "zod";
import type { cutoffQuery } from "@/lib/validation/student";

export type CutoffRow = Prisma.CutoffGetPayload<{
  include: { college: { select: { slug: true; name: true; code: true; district: true } }; branch: { select: { slug: true; shortName: true; name: true } }; source: true };
}>;

const cutoffInclude = {
  college: { select: { slug: true, name: true, code: true, district: true } },
  branch: { select: { slug: true, shortName: true, name: true } },
  source: true,
} satisfies Prisma.CutoffInclude;

export async function queryCutoffs(q: z.infer<typeof cutoffQuery>) {
  const where: Prisma.CutoffWhereInput = {};
  if (q.college) where.college = { OR: [{ slug: q.college }, { code: q.college.toUpperCase() }] };
  if (q.branch) where.branch = { OR: [{ slug: q.branch }, { code: q.branch.toUpperCase() }, { shortName: q.branch.toUpperCase() }] };
  if (q.year) where.year = q.year;
  if (q.round) where.round = q.round;
  if (q.category) where.category = q.category;
  if (q.gender) where.gender = q.gender;
  if (q.maxRank !== undefined || q.minRank !== undefined)
    where.closingRank = { ...(q.maxRank !== undefined ? { lte: q.maxRank } : {}), ...(q.minRank !== undefined ? { gte: q.minRank } : {}) };

  const [total, items] = await Promise.all([
    prisma.cutoff.count({ where }),
    prisma.cutoff.findMany({
      where,
      include: cutoffInclude,
      orderBy: [{ year: "desc" }, { round: "asc" }, { closingRank: "asc" }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return { items, total, page: q.page, pageSize: q.pageSize };
}

/** All cutoff rows for a college (optionally one branch), used by profile pages & charts. */
export async function getCollegeCutoffs(collegeId: string, branchId?: string) {
  return prisma.cutoff.findMany({
    where: { collegeId, ...(branchId ? { branchId } : {}) },
    include: cutoffInclude,
    orderBy: [{ branchId: "asc" }, { year: "asc" }, { round: "asc" }, { category: "asc" }],
  });
}

export function toPoints(rows: { year: number; round: number; category: string; openingRank: number | null; closingRank: number }[]): CutoffPoint[] {
  return rows.map((r) => ({ year: r.year, round: r.round, category: r.category, openingRank: r.openingRank, closingRank: r.closingRank }));
}

/** Per-branch stats for a college (GM, ALL, GENERAL by default). */
export async function getCollegeBranchStats(collegeId: string, category = "GM") {
  const rows = await prisma.cutoff.findMany({
    where: { collegeId, category, gender: "ALL", seatType: "GENERAL" },
    select: { branchId: true, year: true, round: true, category: true, openingRank: true, closingRank: true, branch: { select: { slug: true, shortName: true, name: true } } },
  });
  const byBranch = new Map<string, { branch: { slug: string; shortName: string; name: string }; points: CutoffPoint[] }>();
  for (const r of rows) {
    if (!byBranch.has(r.branchId)) byBranch.set(r.branchId, { branch: r.branch, points: [] });
    byBranch.get(r.branchId)!.points.push(r);
  }
  return Array.from(byBranch.entries()).map(([branchId, v]) => ({ branchId, branch: v.branch, stats: computeStats(v.points) }));
}

export async function getCutoffFilterOptions() {
  const [years, categories, rounds] = await Promise.all([
    prisma.cutoff.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "desc" } }),
    prisma.cutoff.findMany({ select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
    prisma.cutoff.findMany({ select: { round: true }, distinct: ["round"], orderBy: { round: "asc" } }),
  ]);
  return { years: years.map((y) => y.year), categories: categories.map((c) => c.category), rounds: rounds.map((r) => r.round) };
}
