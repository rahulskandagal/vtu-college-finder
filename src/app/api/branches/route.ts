import { handler, ok } from "@/lib/api";
import { listBranches } from "@/lib/data/branches";

export const GET = handler(async () => ok(await listBranches()));
