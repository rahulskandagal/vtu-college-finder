import { fail, handler, ok } from "@/lib/api";
import { getCollegeBySlug } from "@/lib/data/colleges";
import { getCollegeBranchStats } from "@/lib/data/cutoffs";

/** GET /api/colleges/:slug — full profile (accepts slug or KEA code). */
export const GET = handler(async (_req, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const college = await getCollegeBySlug(slug);
  if (!college) return fail(404, "College not found");
  const branchStats = await getCollegeBranchStats(college.id);
  return ok({ ...college, branchStats });
});
