import { prisma } from "@/lib/prisma";
import { fail, handler, ok, requireUser } from "@/lib/api";

/** DELETE /api/shortlist/:id — `id` may be the shortlist row id or the college id. */
export const DELETE = handler(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const row = await prisma.shortlist.findFirst({ where: { userId: user.id, OR: [{ id }, { collegeId: id }] } });
  if (!row) return fail(404, "Shortlist entry not found");
  await prisma.shortlist.delete({ where: { id: row.id } });
  return ok({ deleted: true });
});
