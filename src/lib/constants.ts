/** Shared domain constants. Keep UI option lists and validation in sync from here. */

export const APP_NAME = "VTU College Finder";
export const APP_TAGLINE =
  "Engineering college discovery, KCET cutoff history and career information for Karnataka students.";

export const DISCLAIMER =
  "KCET cutoff information shown on this platform is based on historical and publicly available data. Cutoffs can change from year to year depending on category, seat availability, demand, counselling rounds and other factors. This platform does not guarantee admission.";

export const DEMO_NOTICE =
  "Demo data — this record is seeded sample data for development and is NOT official information. Verify with KEA and the college before making any decision.";

/** KCET reservation categories as used in KEA allotment documents. */
export const KCET_CATEGORIES = [
  { code: "GM", label: "GM — General Merit" },
  { code: "GMK", label: "GMK — GM, Kannada medium" },
  { code: "GMR", label: "GMR — GM, rural" },
  { code: "GMP", label: "GMP — GM, special (as per KEA)" },
  { code: "1G", label: "1G — Category 1" },
  { code: "1K", label: "1K — Category 1, Kannada medium" },
  { code: "1R", label: "1R — Category 1, rural" },
  { code: "2AG", label: "2AG — Category 2A" },
  { code: "2AK", label: "2AK — Category 2A, Kannada medium" },
  { code: "2AR", label: "2AR — Category 2A, rural" },
  { code: "2BG", label: "2BG — Category 2B" },
  { code: "2BK", label: "2BK — Category 2B, Kannada medium" },
  { code: "2BR", label: "2BR — Category 2B, rural" },
  { code: "3AG", label: "3AG — Category 3A" },
  { code: "3AK", label: "3AK — Category 3A, Kannada medium" },
  { code: "3AR", label: "3AR — Category 3A, rural" },
  { code: "3BG", label: "3BG — Category 3B" },
  { code: "3BK", label: "3BK — Category 3B, Kannada medium" },
  { code: "3BR", label: "3BR — Category 3B, rural" },
  { code: "SCG", label: "SCG — Scheduled Caste" },
  { code: "SCK", label: "SCK — SC, Kannada medium" },
  { code: "SCR", label: "SCR — SC, rural" },
  { code: "STG", label: "STG — Scheduled Tribe" },
  { code: "STK", label: "STK — ST, Kannada medium" },
  { code: "STR", label: "STR — ST, rural" },
  { code: "NRI", label: "NRI — NRI quota" },
  { code: "OPN", label: "OPN — Open (as per KEA)" },
  { code: "OTH", label: "OTH — Other (as per KEA)" },
] as const;

export type KcetCategory = (typeof KCET_CATEGORIES)[number]["code"];
export const KCET_CATEGORY_CODES = KCET_CATEGORIES.map((c) => c.code) as unknown as [string, ...string[]];

export const GENDERS = ["ALL", "MALE", "FEMALE"] as const;

export const KARNATAKA_DISTRICTS = [
  "Bengaluru Urban",
  "Bengaluru Rural",
  "Mysuru",
  "Shivamogga",
  "Davangere",
  "Dharwad",
  "Dakshina Kannada",
  "Belagavi",
  "Tumakuru",
  "Ballari",
  "Bagalkot",
  "Hassan",
  "Mandya",
  "Udupi",
  "Kalaburagi",
  "Vijayapura",
  "Chitradurga",
  "Chikkamagaluru",
  "Kolar",
  "Raichur",
  "Bidar",
  "Haveri",
  "Gadag",
  "Uttara Kannada",
  "Kodagu",
  "Chamarajanagar",
  "Ramanagara",
  "Chikkaballapur",
  "Yadgir",
  "Koppal",
  "Vijayanagara",
] as const;

export const COLLEGE_TYPES = [
  { value: "GOVERNMENT", label: "Government" },
  { value: "AIDED", label: "Government aided" },
  { value: "PRIVATE", label: "Private" },
  { value: "UNIVERSITY", label: "University" },
  { value: "DEEMED", label: "Deemed university" },
] as const;

export const FEE_RANGES = [
  { value: "0-100000", label: "Below ₹1 lakh", min: 0, max: 100000 },
  { value: "100000-200000", label: "₹1 – 2 lakh", min: 100000, max: 200000 },
  { value: "200000-300000", label: "₹2 – 3 lakh", min: 200000, max: 300000 },
  { value: "300000-", label: "₹3 lakh +", min: 300000, max: Number.MAX_SAFE_INTEGER },
] as const;

export const CUTOFF_YEARS = Array.from({ length: 10 }, (_, i) => 2025 - i); // 2025 → 2016
export const MIN_CUTOFF_YEAR = 2010;
export const MAX_CUTOFF_YEAR = 2030;
export const MAX_KCET_RANK = 300000;

export const RECRUITER_SECTORS = [
  "IT",
  "CORE",
  "ELECTRONICS",
  "CONSULTING",
  "FINANCE",
  "AUTOMOTIVE",
  "MANUFACTURING",
  "STARTUP",
  "OTHER",
] as const;

export const OFFICIAL_LINKS = [
  { label: "KEA — Karnataka Examinations Authority", url: "https://cetonline.karnataka.gov.in/kea/" },
  { label: "KEA UGCET (KCET) cutoff & allotment documents", url: "https://cetonline.karnataka.gov.in/kea/" },
  { label: "VTU — Visvesvaraya Technological University", url: "https://vtu.ac.in/" },
  { label: "AICTE approved institutions", url: "https://www.aicte-india.org/" },
  { label: "NBA accreditation", url: "https://www.nbaind.org/" },
  { label: "NAAC accreditation", url: "https://www.naac.gov.in/" },
] as const;

export const SESSION_COOKIE = "vcf_session";
export const COMPARE_STORAGE_KEY = "vcf_compare";
export const MAX_COMPARE = 4;
