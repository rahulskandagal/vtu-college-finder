/**
 * Cutoff bulk-import parsing & validation (CSV / Excel).
 *
 * Expected columns (header names are case-insensitive, order does not matter):
 *   college_code, college_name*, branch, year, round, category, gender*, seat_type*, opening_rank*, closing_rank
 * (* optional). `branch` accepts a branch code ("CS"), slug ("computer-science-engineering") or short name ("CSE").
 */
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { MAX_CUTOFF_YEAR, MIN_CUTOFF_YEAR } from "@/lib/constants";

export type RawRow = Record<string, string | number | null | undefined>;

export type ParsedCutoffRow = {
  rowNumber: number;
  collegeCode: string;
  collegeName?: string;
  branchKey: string;
  year: number;
  round: number;
  category: string;
  gender: "ALL" | "MALE" | "FEMALE";
  seatType: "GENERAL" | "HYDERABAD_KARNATAKA" | "RURAL" | "KANNADA_MEDIUM" | "SNQ" | "OTHER";
  openingRank: number | null;
  closingRank: number;
};

export type RowError = { rowNumber: number; field?: string; message: string };

export type ValidationResult = {
  valid: ParsedCutoffRow[];
  errors: RowError[];
  duplicatesInFile: number;
  total: number;
};

export const REQUIRED_HEADERS = ["college_code", "branch", "year", "category", "closing_rank"] as const;
export const OPTIONAL_HEADERS = ["college_name", "round", "gender", "seat_type", "opening_rank"] as const;

const HEADER_ALIASES: Record<string, string> = {
  collegecode: "college_code",
  code: "college_code",
  college: "college_name",
  collegename: "college_name",
  branchcode: "branch",
  course: "branch",
  openingrank: "opening_rank",
  opening: "opening_rank",
  closingrank: "closing_rank",
  closing: "closing_rank",
  cutoff: "closing_rank",
  seattype: "seat_type",
  quota: "seat_type",
  sex: "gender",
};

export function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const compact = key.replace(/_/g, "");
  return HEADER_ALIASES[compact] ?? key;
}

export function parseCsv(text: string): RawRow[] {
  const res = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });
  return res.data;
}

export function parseExcel(buffer: ArrayBuffer | Uint8Array): RawRow[] {
  const wb = XLSX.read(buffer, { type: buffer instanceof Uint8Array ? "array" : "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
  return rows.map((r) => {
    const out: RawRow = {};
    for (const [k, v] of Object.entries(r)) out[normalizeHeader(k)] = v;
    return out;
  });
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[,\s]/g, "");
  if (s === "" || s === "-" || s.toUpperCase() === "NA") return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

function normGender(v: unknown): ParsedCutoffRow["gender"] | null {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "" || s === "ALL" || s === "A") return "ALL";
  if (["M", "MALE", "BOYS"].includes(s)) return "MALE";
  if (["F", "FEMALE", "GIRLS"].includes(s)) return "FEMALE";
  return null;
}

function normSeatType(v: unknown): ParsedCutoffRow["seatType"] | null {
  const s = String(v ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (s === "" || s === "GENERAL" || s === "G") return "GENERAL";
  if (["HK", "HYDERABAD_KARNATAKA", "HYD_KAR", "KALYANA_KARNATAKA"].includes(s)) return "HYDERABAD_KARNATAKA";
  if (["R", "RURAL"].includes(s)) return "RURAL";
  if (["K", "KANNADA_MEDIUM", "KANNADA"].includes(s)) return "KANNADA_MEDIUM";
  if (["SNQ", "SUPERNUMERARY"].includes(s)) return "SNQ";
  if (s === "OTHER") return "OTHER";
  return null;
}

/**
 * Validate raw rows. `knownCollegeCodes` and `knownBranchKeys` (codes/slugs/short names,
 * upper-cased) are used to detect unknown references before touching the database.
 */
export function validateRows(
  rows: RawRow[],
  knownCollegeCodes: Set<string>,
  knownBranchKeys: Set<string>,
): ValidationResult {
  const errors: RowError[] = [];
  const valid: ParsedCutoffRow[] = [];
  const seen = new Set<string>();
  let duplicatesInFile = 0;

  rows.forEach((raw, i) => {
    const rowNumber = i + 2; // header = row 1
    const rowErrors: RowError[] = [];
    const get = (k: string) => raw[k];

    const collegeCode = String(get("college_code") ?? "").trim().toUpperCase();
    if (!collegeCode) rowErrors.push({ rowNumber, field: "college_code", message: "Missing college_code" });
    else if (!knownCollegeCodes.has(collegeCode))
      rowErrors.push({ rowNumber, field: "college_code", message: `Unknown college code "${collegeCode}"` });

    const branchKey = String(get("branch") ?? "").trim().toUpperCase();
    if (!branchKey) rowErrors.push({ rowNumber, field: "branch", message: "Missing branch" });
    else if (!knownBranchKeys.has(branchKey))
      rowErrors.push({ rowNumber, field: "branch", message: `Unknown branch "${branchKey}"` });

    const year = toInt(get("year"));
    if (year === null) rowErrors.push({ rowNumber, field: "year", message: "Missing or non-integer year" });
    else if (year < MIN_CUTOFF_YEAR || year > MAX_CUTOFF_YEAR)
      rowErrors.push({ rowNumber, field: "year", message: `Year ${year} outside ${MIN_CUTOFF_YEAR}–${MAX_CUTOFF_YEAR}` });

    const roundRaw = get("round");
    const round = roundRaw === "" || roundRaw === undefined || roundRaw === null ? 1 : toInt(roundRaw);
    if (round === null || round < 1 || round > 5)
      rowErrors.push({ rowNumber, field: "round", message: "Round must be an integer between 1 and 5" });

    const category = String(get("category") ?? "").trim().toUpperCase();
    if (!category || category.length > 10)
      rowErrors.push({ rowNumber, field: "category", message: "Missing or invalid category" });

    const gender = normGender(get("gender"));
    if (gender === null) rowErrors.push({ rowNumber, field: "gender", message: "Gender must be ALL, MALE or FEMALE" });

    const seatType = normSeatType(get("seat_type"));
    if (seatType === null) rowErrors.push({ rowNumber, field: "seat_type", message: "Unrecognised seat_type" });

    const openingRank = toInt(get("opening_rank"));
    const openingRaw = String(get("opening_rank") ?? "").trim();
    if (openingRaw && openingRank === null)
      rowErrors.push({ rowNumber, field: "opening_rank", message: "opening_rank must be an integer" });

    const closingRank = toInt(get("closing_rank"));
    if (closingRank === null) rowErrors.push({ rowNumber, field: "closing_rank", message: "Missing or non-integer closing_rank" });
    else if (closingRank < 1 || closingRank > 500000)
      rowErrors.push({ rowNumber, field: "closing_rank", message: "closing_rank must be between 1 and 500,000" });
    if (openingRank !== null && closingRank !== null && openingRank > closingRank)
      rowErrors.push({ rowNumber, field: "opening_rank", message: "opening_rank cannot exceed closing_rank" });
    if (openingRank !== null && openingRank < 1)
      rowErrors.push({ rowNumber, field: "opening_rank", message: "opening_rank must be positive" });

    if (rowErrors.length) {
      errors.push(...rowErrors);
      return;
    }

    const key = [collegeCode, branchKey, year, round, category, gender, seatType].join("|");
    if (seen.has(key)) {
      duplicatesInFile += 1;
      errors.push({ rowNumber, message: `Duplicate of an earlier row (${collegeCode}/${branchKey}/${year}/R${round}/${category})` });
      return;
    }
    seen.add(key);

    valid.push({
      rowNumber,
      collegeCode,
      collegeName: get("college_name") ? String(get("college_name")) : undefined,
      branchKey,
      year: year!,
      round: round!,
      category,
      gender: gender!,
      seatType: seatType!,
      openingRank,
      closingRank: closingRank!,
    });
  });

  return { valid, errors, duplicatesInFile, total: rows.length };
}

export const SAMPLE_CSV = `college_code,college_name,branch,year,round,category,gender,seat_type,opening_rank,closing_rank
E005,Example Engineering College,CS,2025,1,GM,ALL,GENERAL,1200,5400
E005,Example Engineering College,CS,2025,2,GM,ALL,GENERAL,1350,6100
E005,Example Engineering College,EC,2025,1,2AG,ALL,GENERAL,4100,15800`;
