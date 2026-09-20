import { prisma } from "@/lib/prisma";
import { created, handler, ok, parseBody, requireUser } from "@/lib/api";
import { reviewSchema } from "@/lib/validation/student";

/** GET /api/reviews?collegeId= — approved reviews only. */
export const GET = handler(async (req) => {
  const collegeId = new URL(req.url).searchParams.get("collegeId") ?? undefined;
  const rows = await prisma.collegeReview.findMany({
    where: { approved: true, ...(collegeId ? { collegeId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, rating: true, text: true, createdAt: true, user: { select: { name: true } }, college: { select: { slug: true, name: true } } },
  });
  return ok(rows);
});

/** POST /api/reviews — submit / update own review (needs admin approval before it is shown). */
export const POST = handler(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, reviewSchema);
  const row = await prisma.collegeReview.upsert({
    where: { userId_collegeId: { userId: user.id, collegeId: input.collegeId } },
    update: { rating: input.rating, text: input.text ?? null, approved: false },
    create: { userId: user.id, collegeId: input.collegeId, rating: input.rating, text: input.text ?? null },
  });
  return created(row);
});
