/**
 * Import official KEA (Karnataka Examinations Authority) engineering cut-off
 * documents parsed to JSON by `scripts/parse_kea_cutoff_pdf.py`.
 *
 *   npx tsx prisma/import-kea.ts            # import / update from data/kea/*.json
 *   npx tsx prisma/import-kea.ts --wipe     # delete ALL colleges (and dependants) first
 *
 * What it writes (all flagged isDemo = false, each cutoff linked to a Source
 * that points at the KEA PDF it came from):
 *   Source          one per document (year / round / seat type)
 *   Branch          canonical branches (prisma/kea/branches.ts) + any KEA course
 *                   that could not be canonicalised, under its KEA label
 *   College         every college code that appears in any document, with name,
 *                   city, district, type/autonomy inferred from the KEA text
 *   CollegeBranch   every (college, branch) pair that has at least one cutoff
 *   Cutoff          one row per (college, branch, year, round, category, seatType)
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CANON, normalizeKey, resolveCanon, titleCase, type CanonBranch } from "./kea/branches";
import { locate, locateIn } from "./kea/geo";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

type Doc = {
  layout: "old" | "new";
  colleges: { code: string; raw: string }[];
  categories: string[];
  rows: { code: string; courseCode: string | null; course: string; courseKey: string; category: string; closingRank: number; seatType: "GENERAL" | "HYDERABAD_KARNATAKA" }[];
  meta: { year: number; round: number; sourceUrl: string; pdf: string };
};

const DATA_DIR = path.join(__dirname, "..", "data", "kea");
const WIPE = process.argv.includes("--wipe");
const COLLEGES_ONLY = process.argv.includes("--colleges-only");

/* ───────────── helpers ───────────── */

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/** HK documents suffix every category with H (1H, GMH, SCKH…). Normalise to the general codes. */
function normalizeCategory(cat: string, seat: string): string {
  if (seat !== "HYDERABAD_KARNATAKA" || !cat.endsWith("H") || cat === "OTH") return cat;
  const base = cat.slice(0, -1);
  if (["1", "2A", "2B", "3A", "3B", "SC", "ST"].includes(base)) return base + "G";
  return base; // GM, GMK, GMR, GMP, 1K, 1R, 2AK …
}

function cleanRaw(raw: string) {
  return raw.replace(/\(\s*(PUBLIC UNIV\.?|H\.?GOV\.?|AUTONOMOUS|AIDED|GOVT\.?)\s*\)/gi, " ").replace(/\s+/g, " ").trim();
}

const STRIP_TAIL = /[\s,.\-–(]+(dist(rict)?|\(d\)|\(tq\)|taluk|tq|campus)?[\s,.\-–)]*$/i;

/** Derive a display name by removing the trailing place descriptor from a KEA "Name City" string. */
function deriveName(oldRaw: string | undefined, newRaw: string | undefined): string {
  if (oldRaw) {
    let s = cleanRaw(oldRaw);
    const m = locateIn(s);
    // Cut at the matched place keyword when it sits in the trailing part of the string
    // ("Atria Institute of Technology Bangalore" → "Atria Institute of Technology"), but keep
    // names that merely start with a place ("Bangalore Institute of Technology").
    if (m && m.index >= 10 && m.index >= s.length * 0.45) s = s.slice(0, m.index);
    s = s.replace(STRIP_TAIL, "").replace(/[,\s.\-–(]+$/, "").trim();
    if (s.length >= 8) return maybeTitle(s);
    s = cleanRaw(oldRaw).replace(STRIP_TAIL, "").trim();
    if (s.length >= 8) return maybeTitle(s);
  }
  if (newRaw) {
    let s = cleanRaw(newRaw);
    s = s.split(/,|VILLAGE|ROAD|POST|NO\.|#|\d{3,}/i)[0].trim();
    s = s.replace(STRIP_TAIL, "").trim();
    return maybeTitle(s || newRaw.slice(0, 80));
  }
  return "Unknown college";
}

function maybeTitle(s: string) {
  const letters = s.replace(/[^A-Za-z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (letters.length > 0 && upper / letters.length > 0.85) {
    return s
      .toLowerCase()
      .replace(/\b([a-z])/g, (m) => m.toUpperCase())
      .replace(/\bOf\b/g, "of")
      .replace(/\bAnd\b/g, "and")
      .replace(/\bFor\b/g, "for")
      .replace(/\bB\.?e\b/g, "B.E.")
      .replace(/\bK\.?l\.?e\b/gi, "K.L.E.")
      .replace(/\bJss\b/g, "JSS")
      .replace(/\bBms\b/g, "BMS")
      .replace(/\bPes\b/g, "PES")
      .replace(/\bRns\b/g, "RNS")
      .replace(/\bSjb\b/g, "SJB")
      .replace(/\bMvj\b/g, "MVJ")
      .replace(/\bCmr\b/g, "CMR")
      .replace(/\bBgs\b/g, "BGS")
      .replace(/\bAgm\b/g, "AGM")
      .replace(/\bSdm\b/g, "SDM")
      .replace(/\bKls\b/g, "KLS")
      .replace(/\bGm\b/g, "GM")
      .replace(/\bNie\b/g, "NIE");
  }
  return s;
}

function inferType(raws: string[]): { type: Prisma.CollegeCreateInput["type"]; autonomous: boolean } {
  const all = raws.join(" | ");
  const autonomous = /AUTONOMOUS/i.test(all);
  if (/\bgovt\b|government|\( ?H\.?GOV|university b\.?d\.?t|govt\./i.test(all)) return { type: "GOVERNMENT", autonomous };
  if (/\buniversity\b/i.test(all) && !/college of engineering,? \(?/i.test(all.split("|")[0] ?? "")) return { type: "UNIVERSITY", autonomous };
  if (/\buniversity\b/i.test(all)) return { type: "UNIVERSITY", autonomous };
  return { type: "PRIVATE", autonomous };
}

/* ───────────── main ───────────── */

async function main() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.startsWith("kea-") && f.endsWith(".json"))
    .sort();
  if (files.length === 0) throw new Error(`No data/kea/kea-*.json files. Run scripts/parse_all_kea.sh first.`);
  const docs: Doc[] = files.map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8")));
  console.log(`Loaded ${docs.length} KEA documents`);

  if (WIPE) {
    const n = await prisma.college.deleteMany({});
    const b = await prisma.branch.deleteMany({});
    console.log(`Wiped ${n.count} colleges (and all dependent records) and ${b.count} branches`);
  }

  // ── Sources ──
  const sourceIdByDoc = new Map<Doc, string>();
  for (const d of docs) {
    const seat = d.rows[0]?.seatType === "HYDERABAD_KARNATAKA" ? "Hyderabad-Karnataka (371-J)" : "General";
    const name = `KEA UGCET-${d.meta.year} Round ${d.meta.round} allotment cut-off ranks (${seat})`;
    const existing = await prisma.source.findFirst({ where: { name } });
    const src =
      existing ??
      (await prisma.source.create({
        data: {
          name,
          url: d.meta.sourceUrl || null,
          publisher: "KEA",
          publicationYear: d.meta.year,
          lastVerifiedAt: new Date(),
          notes: `Parsed from the official KEA PDF (${path.basename(d.meta.pdf)}). Closing ranks only; tie ranks (x.5) rounded.`,
          isDemo: false,
        },
      }));
    sourceIdByDoc.set(d, src.id);
  }

  // ── Branches ──
  const branchIdByCanon = new Map<CanonBranch, string>();
  for (const b of CANON) {
    const row = await prisma.branch.upsert({
      where: { code: b.code },
      update: { slug: b.slug, name: b.name, shortName: b.shortName, category: b.category },
      create: { code: b.code, slug: b.slug, name: b.name, shortName: b.shortName, category: b.category, durationYears: b.code === "AR" ? 5 : 4 },
    });
    branchIdByCanon.set(b, row.id);
  }
  // Fallback branches for KEA courses that could not be canonicalised.
  const fallbackIdByKey = new Map<string, string>();
  let autoCount = 0;
  async function branchIdFor(courseCode: string | null, courseName: string): Promise<string> {
    const canon = resolveCanon(courseCode, courseName);
    if (canon) return branchIdByCanon.get(canon)!;
    const key = courseCode ? `CODE:${courseCode}` : `KEY:${normalizeKey(courseName)}`;
    if (fallbackIdByKey.has(key)) return fallbackIdByKey.get(key)!;
    const label = titleCase(courseName.replace(/\s+/g, " ")) || courseCode || "Unknown course";
    const code = courseCode ? `K-${courseCode}` : `K-${(++autoCount).toString().padStart(3, "0")}`;
    const slug = slugify(`${label}-${courseCode ?? autoCount}`);
    const row = await prisma.branch.upsert({
      where: { code },
      update: {},
      create: { code, slug, name: label, shortName: courseCode ?? label.split(" ").map((w) => w[0]).join("").slice(0, 8).toUpperCase(), category: "OTHER", about: `Course listed by KEA as "${courseName}"${courseCode ? ` (KEA course code ${courseCode})` : ""}. Programme details not yet verified.` },
    });
    fallbackIdByKey.set(key, row.id);
    return row.id;
  }

  // ── Colleges ──
  type Agg = { oldRaws: { year: number; raw: string }[]; newRaws: { year: number; raw: string }[] };
  const agg = new Map<string, Agg>();
  for (const d of docs) {
    for (const c of d.colleges) {
      if (!agg.has(c.code)) agg.set(c.code, { oldRaws: [], newRaws: [] });
      (d.layout === "old" ? agg.get(c.code)!.oldRaws : agg.get(c.code)!.newRaws).push({ year: d.meta.year, raw: c.raw });
    }
  }
  const collegeIdByCode = new Map<string, string>();
  let located = 0;
  for (const [code, a] of agg) {
    a.oldRaws.sort((x, y) => y.year - x.year);
    a.newRaws.sort((x, y) => y.year - x.year);
    const oldRaw = a.oldRaws[0]?.raw;
    const newRaw = a.newRaws[0]?.raw;
    const name = deriveName(oldRaw, newRaw);
    const place = locate(oldRaw, newRaw, name);
    if (place) located++;
    const { type, autonomous } = inferType([oldRaw ?? "", newRaw ?? ""]);
    const address = newRaw ? cleanRaw(newRaw).replace(name, "").replace(/^[\s,]+/, "").trim() || null : null;
    const years = Array.from(new Set([...a.oldRaws, ...a.newRaws].map((r) => r.year))).sort();
    const existing = await prisma.college.findUnique({ where: { code } });
    const slugBase = slugify(name);
    let slug = slugBase;
    if (!existing) {
      let i = 2;
      while (await prisma.college.findUnique({ where: { slug } })) slug = `${slugBase}-${i++}`;
    }
    const data = {
      name,
      city: place?.city ?? "Karnataka",
      district: place?.district ?? "Karnataka (district to verify)",
      address,
      type,
      autonomous,
      isDemo: false,
      lastVerifiedAt: new Date(),
      description: `${name} appears in KEA UGCET engineering allotment documents for ${years[0]}–${years[years.length - 1]} (college code ${code}). Institutional details (accreditation, facilities, fees, placements) have not been loaded yet — see the official website and KEA notifications.`,
    };
    const row = existing
      ? await prisma.college.update({ where: { code }, data: { ...data, slug: existing.slug } })
      : await prisma.college.create({ data: { code, slug, ...data } });
    collegeIdByCode.set(code, row.id);
  }
  console.log(`Colleges: ${agg.size} (${located} located to a district)`);

  if (COLLEGES_ONLY) {
    console.log("--colleges-only: skipping cutoff import");
    return;
  }

  // ── Cutoffs ──
  let total = 0;
  const pairs = new Set<string>();
  for (const d of docs) {
    const sourceId = sourceIdByDoc.get(d)!;
    const batch: Prisma.CutoffCreateManyInput[] = [];
    const branchCache = new Map<string, string>();
    for (const r of d.rows) {
      const collegeId = collegeIdByCode.get(r.code);
      if (!collegeId) continue;
      const bk = `${r.courseCode ?? ""}|${r.courseKey}`;
      let branchId = branchCache.get(bk);
      if (!branchId) {
        branchId = await branchIdFor(r.courseCode, r.course);
        branchCache.set(bk, branchId);
      }
      pairs.add(`${collegeId}|${branchId}`);
      batch.push({
        collegeId,
        branchId,
        year: d.meta.year,
        round: d.meta.round,
        category: normalizeCategory(r.category, r.seatType),
        gender: "ALL",
        seatType: r.seatType,
        openingRank: null,
        closingRank: r.closingRank,
        isDemo: false,
        sourceId,
      });
    }
    // Remove any previous rows for this document (year/round/seat) so re-imports are idempotent.
    await prisma.cutoff.deleteMany({ where: { sourceId } });
    for (let i = 0; i < batch.length; i += 5000) {
      const res = await prisma.cutoff.createMany({ data: batch.slice(i, i + 5000), skipDuplicates: true });
      total += res.count;
    }
    console.log(`  ${path.basename(d.meta.pdf)} → ${batch.length} rows`);
  }

  // ── College ↔ Branch links ──
  const linkData = Array.from(pairs).map((p) => {
    const [collegeId, branchId] = p.split("|");
    return { collegeId, branchId, isDemo: false };
  });
  const linked = await prisma.collegeBranch.createMany({ data: linkData, skipDuplicates: true });

  console.log(`Imported ${total.toLocaleString("en-IN")} cutoff rows, ${linked.count} new college-branch links, ${fallbackIdByKey.size} non-canonical branches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
