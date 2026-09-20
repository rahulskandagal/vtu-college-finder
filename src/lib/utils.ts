import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer rank with Indian digit grouping: 18542 → "18,542". */
export function formatRank(rank: number | null | undefined): string {
  if (rank === null || rank === undefined) return "—";
  return rank.toLocaleString("en-IN");
}

/** Format rupees: 125000 → "₹1,25,000". */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return "₹" + amount.toLocaleString("en-IN");
}

/** Format lakhs-per-annum package: 12.5 → "₹12.5 LPA". */
export function formatLPA(lpa: number | null | undefined): string {
  if (lpa === null || lpa === undefined) return "—";
  return `₹${lpa % 1 === 0 ? lpa.toFixed(0) : lpa.toFixed(1)} LPA`;
}

export function formatPercent(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

/** Turn "JSS Science & Technology University" into "jss-science-technology-university". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Human label for enum-style strings: "COMPUTER_SCIENCE" → "Computer science". */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = obj[k];
  return out;
}
