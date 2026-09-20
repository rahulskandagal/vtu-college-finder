import { prisma } from "@/lib/prisma";
import { handler, ok, requireAdmin } from "@/lib/api";

export const GET = handler(async () => {
  await requireAdmin();
  const [colleges, branches, cutoffs, fees, faculty, events, clubs, users, demoCutoffs, imports, pendingReviews] = await Promise.all([
    prisma.college.count(),
    prisma.branch.count(),
    prisma.cutoff.count(),
    prisma.fee.count(),
    prisma.faculty.count(),
    prisma.event.count(),
    prisma.club.count(),
    prisma.user.count(),
    prisma.cutoff.count({ where: { isDemo: true } }),
    prisma.importLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } }),
    prisma.collegeReview.count({ where: { approved: false } }),
  ]);
  return ok({ colleges, branches, cutoffs, fees, faculty, events, clubs, users, demoCutoffs, imports, pendingReviews });
});
