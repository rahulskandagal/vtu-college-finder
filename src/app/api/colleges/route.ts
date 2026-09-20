import { handler, ok, parseQuery } from "@/lib/api";
import { listColleges } from "@/lib/data/colleges";
import { collegeListQuery } from "@/lib/validation/student";

/** GET /api/colleges?q=&district=&type=&branch=&fee=&hostel=&minPlacement=&sort=&page= */
export const GET = handler(async (req) => ok(await listColleges(parseQuery(req, collegeListQuery))));
