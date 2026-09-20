import { prisma } from "@/lib/prisma";
import { enforceRateLimit, fail, handler, ok, parseBody } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";

export const POST = handler(async (req) => {
  enforceRateLimit(req, "login", 20, 15 * 60_000);
  const input = await parseBody(req, loginSchema);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    return fail(401, "Invalid email or password");
  }
  const session = { id: user.id, email: user.email, name: user.name, role: user.role };
  await setSessionCookie(session);
  return ok(session);
});
