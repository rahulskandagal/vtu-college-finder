import { prisma } from "@/lib/prisma";
import { created, handler, ok, parseBody, requireUser } from "@/lib/api";
import { shortlistCreateSchema } from "@/lib/validation/student";

export const GET = handler(async () => {
  const user = await requireUser();
  const items = await prisma.shortlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      college: { select: { id: true, slug: true, name: true, district: true, city: true, isDemo: true } },
      branch: { select: { slug: true, shortName: true } },
    },
  });
  return ok(items);
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, shortlistCreateSchema);
  const item = await prisma.shortlist.upsert({
    where: { userId_collegeId: { userId: user.id, collegeId: input.collegeId } },
    update: { branchId: input.branchId ?? null, note: input.note ?? null },
    create: { userId: user.id, collegeId: input.collegeId, branchId: input.branchId ?? null, note: input.note ?? null },
    include: { college: { select: { slug: true, name: true } } },
  });
  return created(item);
});
