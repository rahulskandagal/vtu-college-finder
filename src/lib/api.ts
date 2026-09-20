import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getSession, type SessionUser } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status });
}

/** Wrap a route handler with uniform error handling. */
export function handler<Ctx = unknown>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.status, err.message, err.details);
      if (err instanceof ZodError) return fail(400, "Validation failed", err.issues);
      if (err instanceof SyntaxError) return fail(400, "Malformed JSON body");
      // Prisma unique-constraint violations surface as P2002
      const code = (err as { code?: string })?.code;
      if (code === "P2002") return fail(409, "A record with the same unique fields already exists");
      if (code === "P2025") return fail(404, "Record not found");
      console.error("[api]", err);
      return fail(500, "Internal server error");
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}

export function parseQuery<T>(req: Request, schema: ZodType<T>): T {
  const url = new URL(req.url);
  const raw: Record<string, string | string[]> = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (k in raw) {
      const cur = raw[k];
      raw[k] = Array.isArray(cur) ? [...cur, v] : [cur, v];
    } else raw[k] = v;
  }
  return schema.parse(raw);
}

export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new ApiError(401, "Authentication required");
  return s;
}

export async function requireAdmin(): Promise<SessionUser> {
  const s = await requireUser();
  if (s.role !== "ADMIN") throw new ApiError(403, "Admin access required");
  return s;
}

export function enforceRateLimit(req: Request, scope: string, limit: number, windowMs: number) {
  const r = rateLimit(clientKey(req, scope), limit, windowMs);
  if (!r.ok) throw new ApiError(429, `Too many requests. Retry in ${r.retryAfter}s`);
}
