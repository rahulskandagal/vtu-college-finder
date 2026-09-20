import { z } from "zod";
import { created, fail, handler, ok, parseQuery, requireAdmin } from "@/lib/api";
import { getResource } from "@/lib/admin/registry";

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  collegeId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});

/** GET /api/admin/:resource?q=&collegeId=&page= */
export const GET = handler(async (req, ctx: { params: Promise<{ resource: string }> }) => {
  await requireAdmin();
  const { resource } = await ctx.params;
  const def = getResource(resource);
  if (!def) return fail(404, "Unknown admin resource");
  const q = parseQuery(req, listQuery);

  const where: Record<string, unknown> = {};
  if (q.q && def.searchFields.length) {
    where.OR = def.searchFields.map((f) => ({ [f]: { contains: q.q, mode: "insensitive" } }));
  }
  if (q.collegeId && resource !== "colleges") where.collegeId = q.collegeId;

  const [total, items] = await Promise.all([
    def.delegate.count({ where }),
    def.delegate.findMany({
      where,
      include: def.include,
      orderBy: def.orderBy,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return ok({ items, total, page: q.page, pageSize: q.pageSize, columns: def.columns, label: def.label });
});

/** POST /api/admin/:resource — create. */
export const POST = handler(async (req, ctx: { params: Promise<{ resource: string }> }) => {
  await requireAdmin();
  const { resource } = await ctx.params;
  const def = getResource(resource);
  if (!def) return fail(404, "Unknown admin resource");
  let data = def.schema.parse(await req.json());
  if (def.beforeCreate) data = def.beforeCreate(data);
  const row = await def.delegate.create({ data, include: def.include });
  return created(row);
});
