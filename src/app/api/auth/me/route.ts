import { handler, ok } from "@/lib/api";
import { getSession } from "@/lib/auth/session";

export const GET = handler(async () => ok(await getSession()));
