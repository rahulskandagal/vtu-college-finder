import "server-only";
import { prisma } from "@/lib/prisma";
import { buildCards } from "./colleges";

/** Global search across colleges (name/code/city/district) and branches. */
export async function globalSearch(q: string, limit = 12) {
  const term = q.trim();
  if (!term) return { colleges: [], branches: [] };
  const [collegeRows, branches] = await Promise.all([
    prisma.college.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { shortName: { contains: term, mode: "insensitive" } },
          { code: { contains: term, mode: "insensitive" } },
          { city: { contains: term, mode: "insensitive" } },
          { district: { contains: term, mode: "insensitive" } },
          { branches: { some: { branch: { OR: [{ name: { contains: term, mode: "insensitive" } }, { shortName: { equals: term.toUpperCase() } }] } } } },
        ],
      },
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true, slug: true, code: true, name: true, shortName: true, district: true, city: true, type: true,
        establishedYear: true, autonomous: true, accreditation: true, hostelAvailable: true, imageUrl: true, isDemo: true,
        branches: { select: { branch: { select: { slug: true, shortName: true, name: true, category: true } } } },
      },
    }),
    prisma.branch.findMany({
      where: { OR: [{ name: { contains: term, mode: "insensitive" } }, { shortName: { contains: term, mode: "insensitive" } }, { code: { equals: term.toUpperCase() } }] },
      take: 6,
      select: { id: true, slug: true, name: true, shortName: true, category: true },
    }),
  ]);
  const colleges = await buildCards(collegeRows);
  return { colleges, branches };
}

export async function getHomeStats() {
  const [colleges, branches, cutoffs, years, districts] = await Promise.all([
    prisma.college.count(),
    prisma.branch.count(),
    prisma.cutoff.count(),
    prisma.cutoff.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "asc" } }),
    prisma.college.findMany({ select: { district: true }, distinct: ["district"] }),
  ]);
  return {
    colleges,
    branches,
    cutoffs,
    yearRange: years.length ? { from: years[0].year, to: years[years.length - 1].year } : null,
    districts: districts.length,
  };
}
