import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { SESSION_TTL_SECONDS, signSession, verifySessionToken, type SessionUser } from "./session-edge";

export type { SessionUser };
export { signSession, verifySessionToken };

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Read the current session from the request cookie (server components & route handlers). */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
