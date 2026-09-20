import { z } from "zod";
import { handler, ok, parseQuery } from "@/lib/api";
import { globalSearch } from "@/lib/data/search";

const schema = z.object({
  q: z.string().trim().max(100).default(""),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

/** GET /api/search?q=jnnce */
export const GET = handler(async (req) => {
  const { q, limit } = parseQuery(req, schema);
  return ok(await globalSearch(q, limit));
});
