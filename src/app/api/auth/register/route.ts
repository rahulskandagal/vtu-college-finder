import { prisma } from "@/lib/prisma";
import { created, enforceRateLimit, fail, handler, parseBody } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validation/auth";

export const POST = handler(async (req) => {
  enforceRateLimit(req, "register", 10, 15 * 60_000);
  const input = await parseBody(req, registerSchema);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return fail(409, "An account with this email already exists");
  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash: await hashPassword(input.password), role: "STUDENT" },
    select: { id: true, email: true, name: true, role: true },
  });
  await setSessionCookie(user);
  return created(user);
});
