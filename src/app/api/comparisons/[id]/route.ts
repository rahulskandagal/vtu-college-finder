import { prisma } from "@/lib/prisma";
import { fail, handler, ok, requireUser } from "@/lib/api";

export const DELETE = handler(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const row = await prisma.comparison.findFirst({ where: { id, userId: user.id } });
  if (!row) return fail(404, "Comparison not found");
  await prisma.comparison.delete({ where: { id } });
  return ok({ deleted: true });
});
