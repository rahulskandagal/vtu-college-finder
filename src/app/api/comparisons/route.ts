import { prisma } from "@/lib/prisma";
import { created, fail, handler, ok, parseBody, requireUser } from "@/lib/api";
import { comparisonCreateSchema } from "@/lib/validation/student";

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await prisma.comparison.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const ids = Array.from(new Set(rows.flatMap((r) => r.collegeIds)));
  const colleges = await prisma.college.findMany({ where: { id: { in: ids } }, select: { id: true, slug: true, name: true, shortName: true } });
  const byId = new Map(colleges.map((c) => [c.id, c]));
  return ok(rows.map((r) => ({ ...r, colleges: r.collegeIds.map((id) => byId.get(id)).filter(Boolean) })));
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, comparisonCreateSchema);
  const count = await prisma.college.count({ where: { id: { in: input.collegeIds } } });
  if (count !== input.collegeIds.length) return fail(400, "One or more colleges do not exist");
  const row = await prisma.comparison.create({ data: { userId: user.id, name: input.name, collegeIds: input.collegeIds } });
  return created(row);
});
