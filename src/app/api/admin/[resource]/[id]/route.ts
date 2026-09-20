import { fail, handler, ok, requireAdmin } from "@/lib/api";
import { getResource } from "@/lib/admin/registry";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export const GET = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const { resource, id } = await ctx.params;
  const def = getResource(resource);
  if (!def) return fail(404, "Unknown admin resource");
  const row = await def.delegate.findUnique({ where: { id }, include: def.include });
  if (!row) return fail(404, "Record not found");
  return ok(row);
});

async function update(req: Request, ctx: Ctx) {
  await requireAdmin();
  const { resource, id } = await ctx.params;
  const def = getResource(resource);
  if (!def) return fail(404, "Unknown admin resource");
  // Partial updates: validate the merged object so cross-field rules still apply.
  const existing = await def.delegate.findUnique({ where: { id } });
  if (!existing) return fail(404, "Record not found");
  const body = (await req.json()) as Record<string, unknown>;
  const merged = def.schema.parse({ ...existing, ...body });
  const row = await def.delegate.update({ where: { id }, data: merged, include: def.include });
  return ok(row);
}
export const PUT = handler(update);
export const PATCH = handler(update);

export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const { resource, id } = await ctx.params;
  const def = getResource(resource);
  if (!def) return fail(404, "Unknown admin resource");
  await def.delegate.delete({ where: { id } });
  return ok({ deleted: true });
});
