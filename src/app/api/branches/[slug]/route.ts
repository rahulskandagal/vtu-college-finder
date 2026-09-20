import { fail, handler, ok } from "@/lib/api";
import { getBranchBySlug, getBranchCutoffOverview } from "@/lib/data/branches";

export const GET = handler(async (req, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const branch = await getBranchBySlug(slug);
  if (!branch) return fail(404, "Branch not found");
  const category = new URL(req.url).searchParams.get("category")?.toUpperCase() || "GM";
  const cutoffOverview = await getBranchCutoffOverview(branch.id, category);
  return ok({ ...branch, cutoffOverview });
});
