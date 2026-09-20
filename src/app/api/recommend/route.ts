import { enforceRateLimit, handler, ok, parseBody } from "@/lib/api";
import { recommendColleges } from "@/lib/data/recommend";
import { recommendSchema } from "@/lib/validation/student";
import { DISCLAIMER } from "@/lib/constants";

/** POST /api/recommend — group college/branch combinations by historical cutoff relative to a KCET rank. */
export const POST = handler(async (req) => {
  enforceRateLimit(req, "recommend", 60, 60_000);
  const input = await parseBody(req, recommendSchema);
  const result = await recommendColleges(input);
  return ok({ ...result, disclaimer: DISCLAIMER });
});
