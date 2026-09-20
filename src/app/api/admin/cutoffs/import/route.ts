import { prisma } from "@/lib/prisma";
import { fail, handler, ok, requireAdmin } from "@/lib/api";
import { parseCsv, parseExcel, validateRows, type RawRow } from "@/lib/import/cutoffs";

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/admin/cutoffs/import  (multipart/form-data)
 *   file       — .csv / .xlsx / .xls
 *   mode       — "validate" (dry run, default) | "import"
 *   sourceId   — optional Source id to attach to every imported row
 *   isDemo     — "true" to flag rows as demo
 *   overwrite  — "true" to update existing rows with the same unique key
 */
export const POST = handler(async (req) => {
  const admin = await requireAdmin();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail(400, "Upload a CSV or Excel file in the `file` field");
  if (file.size > MAX_BYTES) return fail(413, "File too large (max 10 MB)");
  const mode = String(form.get("mode") ?? "validate");
  const sourceId = form.get("sourceId") ? String(form.get("sourceId")) : null;
  const isDemo = String(form.get("isDemo") ?? "false") === "true";
  const overwrite = String(form.get("overwrite") ?? "false") === "true";

  const name = file.name.toLowerCase();
  let rows: RawRow[];
  if (name.endsWith(".csv") || name.endsWith(".txt")) rows = parseCsv(await file.text());
  else if (name.endsWith(".xlsx") || name.endsWith(".xls")) rows = parseExcel(new Uint8Array(await file.arrayBuffer()));
  else return fail(400, "Unsupported file type. Use .csv, .xlsx or .xls");
  if (rows.length === 0) return fail(400, "The file contains no data rows");
  if (rows.length > 100_000) return fail(413, "Too many rows (max 100,000 per file)");

  const [colleges, branches] = await Promise.all([
    prisma.college.findMany({ select: { id: true, code: true } }),
    prisma.branch.findMany({ select: { id: true, code: true, slug: true, shortName: true } }),
  ]);
  if (sourceId && !(await prisma.source.findUnique({ where: { id: sourceId } }))) return fail(400, "Unknown sourceId");

  const collegeByCode = new Map(colleges.map((c) => [c.code.toUpperCase(), c.id]));
  const branchByKey = new Map<string, string>();
  for (const b of branches) {
    branchByKey.set(b.code.toUpperCase(), b.id);
    branchByKey.set(b.slug.toUpperCase(), b.id);
    branchByKey.set(b.shortName.toUpperCase(), b.id);
  }

  const result = validateRows(rows, new Set(collegeByCode.keys()), new Set(branchByKey.keys()));

  // Detect rows that already exist in the database.
  const existingKeys = new Set<string>();
  if (result.valid.length) {
    const years = Array.from(new Set(result.valid.map((r) => r.year)));
    const collegeIds = Array.from(new Set(result.valid.map((r) => collegeByCode.get(r.collegeCode)!)));
    const existing = await prisma.cutoff.findMany({
      where: { year: { in: years }, collegeId: { in: collegeIds } },
      select: { collegeId: true, branchId: true, year: true, round: true, category: true, gender: true, seatType: true },
    });
    for (const e of existing) existingKeys.add([e.collegeId, e.branchId, e.year, e.round, e.category, e.gender, e.seatType].join("|"));
  }
  const toKey = (r: (typeof result.valid)[number]) =>
    [collegeByCode.get(r.collegeCode), branchByKey.get(r.branchKey), r.year, r.round, r.category, r.gender, r.seatType].join("|");
  const duplicatesInDb = result.valid.filter((r) => existingKeys.has(toKey(r))).length;

  const summary = {
    total: result.total,
    valid: result.valid.length,
    invalid: result.errors.length,
    duplicatesInFile: result.duplicatesInFile,
    duplicatesInDb,
    errors: result.errors.slice(0, 200),
    preview: result.valid.slice(0, 20),
  };

  if (mode !== "import") return ok({ mode: "validate", ...summary });

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const BATCH = 1000;
  const newRows = result.valid.filter((r) => !existingKeys.has(toKey(r)));
  const dupRows = result.valid.filter((r) => existingKeys.has(toKey(r)));

  for (let i = 0; i < newRows.length; i += BATCH) {
    const chunk = newRows.slice(i, i + BATCH).map((r) => ({
      collegeId: collegeByCode.get(r.collegeCode)!,
      branchId: branchByKey.get(r.branchKey)!,
      year: r.year,
      round: r.round,
      category: r.category,
      gender: r.gender,
      seatType: r.seatType,
      openingRank: r.openingRank,
      closingRank: r.closingRank,
      isDemo,
      sourceId,
    }));
    const res = await prisma.cutoff.createMany({ data: chunk, skipDuplicates: true });
    imported += res.count;
  }
  if (overwrite) {
    for (const r of dupRows) {
      await prisma.cutoff.update({
        where: {
          collegeId_branchId_year_round_category_gender_seatType: {
            collegeId: collegeByCode.get(r.collegeCode)!,
            branchId: branchByKey.get(r.branchKey)!,
            year: r.year,
            round: r.round,
            category: r.category,
            gender: r.gender,
            seatType: r.seatType,
          },
        },
        data: { openingRank: r.openingRank, closingRank: r.closingRank, isDemo, sourceId },
      });
      updated += 1;
    }
  } else skipped = dupRows.length;

  const status = result.errors.length === 0 ? "SUCCESS" : imported + updated > 0 ? "PARTIAL" : "FAILED";
  await prisma.importLog.create({
    data: {
      userId: admin.id,
      filename: file.name,
      entity: "cutoffs",
      rowsTotal: result.total,
      rowsImported: imported + updated,
      rowsSkipped: skipped + result.errors.length,
      status,
      errors: result.errors.slice(0, 500),
    },
  });

  return ok({ mode: "import", imported, updated, skipped, status, ...summary });
});
