import { prisma } from "@/lib/prisma";
import { handler, ok, parseBody, requireUser } from "@/lib/api";
import { profileSchema } from "@/lib/validation/student";

export const GET = handler(async () => {
  const user = await requireUser();
  return ok(await prisma.studentProfile.findUnique({ where: { userId: user.id } }));
});

async function upsert(req: Request) {
  const user = await requireUser();
  const input = await parseBody(req, profileSchema);
  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: input,
    create: { userId: user.id, ...input },
  });
  return ok(profile);
}

export const POST = handler(upsert);
export const PUT = handler(upsert);
