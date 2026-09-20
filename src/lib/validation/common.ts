import { z } from "zod";
import { MAX_CUTOFF_YEAR, MAX_KCET_RANK, MIN_CUTOFF_YEAR } from "@/lib/constants";

export const idSchema = z.string().min(1).max(64);
export const yearSchema = z.coerce.number().int().min(MIN_CUTOFF_YEAR).max(MAX_CUTOFF_YEAR);
export const rankSchema = z.coerce.number().int().min(1).max(MAX_KCET_RANK);
export const categorySchema = z.string().trim().toUpperCase().min(1).max(10);
export const genderSchema = z.enum(["ALL", "MALE", "FEMALE"]).default("ALL");
export const roundSchema = z.coerce.number().int().min(1).max(5);

/** Accept a single value or a repeated query param and normalise to an array. */
export const stringList = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split(",")))
  .transform((arr) => arr.map((s) => s.trim()).filter(Boolean));

export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const optionalUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const optionalString = (max = 5000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v ?? null));

export const optionalInt = z
  .union([z.coerce.number().int(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v === undefined || v === null || Number.isNaN(v) ? null : v));

export const optionalFloat = z
  .union([z.coerce.number(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v === undefined || v === null || Number.isNaN(v) ? null : v));

export const stringArray = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((v) => {
    if (!v) return [] as string[];
    const arr = Array.isArray(v) ? v : v.split(/\r?\n|,/);
    return arr.map((s) => s.trim()).filter(Boolean);
  });
