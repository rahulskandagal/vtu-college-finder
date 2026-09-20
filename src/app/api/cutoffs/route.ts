import { handler, ok, parseQuery } from "@/lib/api";
import { queryCutoffs } from "@/lib/data/cutoffs";
import { cutoffQuery } from "@/lib/validation/student";

/** GET /api/cutoffs?college=&branch=&year=&round=&category=&gender=&maxRank=&minRank=&page=&pageSize= */
export const GET = handler(async (req) => ok(await queryCutoffs(parseQuery(req, cutoffQuery))));
