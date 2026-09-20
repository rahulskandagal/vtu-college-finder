import "server-only";
import { prisma } from "@/lib/prisma";
import { computeStats, type CutoffPoint } from "@/lib/cutoff-engine";

export async function listBranches() {
  const branches = await prisma.branch.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { _count: { select: { colleges: true } } },
  });
  return branches;
}

export async function getBranchBySlug(slug: string) {
  return prisma.branch.findFirst({
    where: { OR: [{ slug }, { code: slug.toUpperCase() }, { shortName: slug.toUpperCase() }] },
    include: {
      colleges: {
        include: {
          college: { select: { id: true, slug: true, code: true, name: true, district: true, city: true, type: true, isDemo: true } },
          department: { select: { name: true, hod: true } },
        },
        orderBy: { college: { name: "asc" } },
      },
    },
  });
}

/** Branch-level cutoff summary across all colleges for a category. */
export async function getBranchCutoffOverview(branchId: string, category = "GM") {
  const rows = await prisma.cutoff.findMany({
    where: { branchId, category, gender: "ALL", seatType: "GENERAL" },
    select: {
      collegeId: true,
      year: true,
      round: true,
      category: true,
      openingRank: true,
      closingRank: true,
      college: { select: { slug: true, name: true, shortName: true, district: true, isDemo: true } },
    },
  });
  const byCollege = new Map<string, { college: (typeof rows)[number]["college"]; points: CutoffPoint[] }>();
  for (const r of rows) {
    if (!byCollege.has(r.collegeId)) byCollege.set(r.collegeId, { college: r.college, points: [] });
    byCollege.get(r.collegeId)!.points.push(r);
  }
  return Array.from(byCollege.entries())
    .map(([collegeId, v]) => ({ collegeId, college: v.college, stats: computeStats(v.points) }))
    .sort((a, b) => (a.stats.latest?.finalClosing ?? Infinity) - (b.stats.latest?.finalClosing ?? Infinity));
}

/** Data for the branch-comparison page: per branch, aggregated numbers across colleges. */
export async function compareBranches(slugs: string[], category = "GM") {
  const branches = await prisma.branch.findMany({ where: { slug: { in: slugs } } });
  const out = [];
  for (const b of branches) {
    const [cutoffs, fees, labs, collegesCount] = await Promise.all([
      prisma.cutoff.findMany({
        where: { branchId: b.id, category, gender: "ALL", seatType: "GENERAL" },
        select: { year: true, round: true, category: true, openingRank: true, closingRank: true, collegeId: true },
      }),
      prisma.fee.findMany({ where: { branchId: b.id, quota: "KCET" }, orderBy: { year: "desc" }, select: { tuitionFee: true, universityFee: true, examFee: true, otherFee: true, year: true } }),
      prisma.laboratory.count({ where: { department: { branches: { some: { branchId: b.id } } } } }),
      prisma.collegeBranch.count({ where: { branchId: b.id } }),
    ]);
    // Per-year median of final closing ranks across colleges
    const perCollege = new Map<string, CutoffPoint[]>();
    for (const c of cutoffs) {
      if (!perCollege.has(c.collegeId)) perCollege.set(c.collegeId, []);
      perCollege.get(c.collegeId)!.push(c);
    }
    const yearValues = new Map<number, number[]>();
    let minClosing: number | null = null;
    let maxClosing: number | null = null;
    for (const pts of perCollege.values()) {
      const stats = computeStats(pts);
      for (const y of stats.years) {
        if (!yearValues.has(y.year)) yearValues.set(y.year, []);
        yearValues.get(y.year)!.push(y.finalClosing);
      }
      if (stats.latest) {
        minClosing = minClosing === null ? stats.latest.finalClosing : Math.min(minClosing, stats.latest.finalClosing);
        maxClosing = maxClosing === null ? stats.latest.finalClosing : Math.max(maxClosing, stats.latest.finalClosing);
      }
    }
    const trend = Array.from(yearValues.entries())
      .map(([year, vals]) => {
        const s = [...vals].sort((a, b) => a - b);
        const mid = Math.floor(s.length / 2);
        return { year, median: s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2), min: s[0], max: s[s.length - 1] };
      })
      .sort((a, b) => a.year - b.year);
    const latestFeeYear = fees[0]?.year;
    const feeTotals = fees.filter((f) => f.year === latestFeeYear).map((f) => f.tuitionFee + f.universityFee + f.examFee + f.otherFee);
    out.push({
      branch: b,
      collegesCount,
      labsCount: labs,
      latestClosingRange: minClosing !== null ? { min: minClosing, max: maxClosing! } : null,
      trend,
      feeRange: feeTotals.length ? { year: latestFeeYear!, min: Math.min(...feeTotals), max: Math.max(...feeTotals) } : null,
    });
  }
  return out;
}
