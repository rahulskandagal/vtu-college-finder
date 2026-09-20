import { z } from "zod";
import { KCET_CATEGORY_CODES, KARNATAKA_DISTRICTS } from "@/lib/constants";
import { idSchema, rankSchema, stringList } from "./common";

export const recommendSchema = z.object({
  rank: rankSchema,
  category: z.enum(KCET_CATEGORY_CODES).default("GM"),
  gender: z.enum(["ALL", "MALE", "FEMALE"]).default("ALL"),
  branches: z.array(z.string()).max(10).default([]), // branch slugs; empty = all
  districts: z.array(z.string()).max(31).default([]),
  collegeTypes: z.array(z.string()).max(5).default([]),
  maxFee: z.coerce.number().int().min(0).max(5_000_000).optional(),
  hostelRequired: z.boolean().default(false),
  placementImportance: z.coerce.number().int().min(1).max(5).default(3),
  years: z.array(z.coerce.number().int()).max(15).optional(), // which years to consider
});
export type RecommendInput = z.infer<typeof recommendSchema>;

export const profileSchema = z.object({
  kcetRank: rankSchema.optional().nullable(),
  category: z.enum(KCET_CATEGORY_CODES).optional().nullable(),
  gender: z.enum(["ALL", "MALE", "FEMALE"]).optional().nullable(),
  preferredBranches: z.array(z.string()).max(10).default([]),
  preferredDistricts: z.array(z.enum(KARNATAKA_DISTRICTS)).max(31).default([]),
  collegeTypePref: z.string().max(30).optional().nullable(),
  budgetMax: z.coerce.number().int().min(0).max(5_000_000).optional().nullable(),
  hostelRequired: z.boolean().default(false),
  placementImportance: z.coerce.number().int().min(1).max(5).default(3),
  campusPreference: z.string().max(200).optional().nullable(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const shortlistCreateSchema = z.object({
  collegeId: idSchema,
  branchId: idSchema.optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const comparisonCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  collegeIds: z.array(idSchema).min(2).max(4),
});

export const reviewSchema = z.object({
  collegeId: idSchema,
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().max(2000).optional().nullable(),
});

export const collegeListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  district: stringList.optional(),
  type: stringList.optional(),
  branch: stringList.optional(),
  fee: z.string().optional(), // "0-100000" etc.
  hostel: z.enum(["yes", "no"]).optional(),
  minPlacement: z.coerce.number().min(0).max(100).optional(),
  sort: z.enum(["name", "cutoff", "fee", "placement", "established"]).default("name"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type CollegeListQuery = z.infer<typeof collegeListQuery>;

export const cutoffQuery = z.object({
  college: z.string().optional(), // slug or code
  branch: z.string().optional(), // slug or code
  year: z.coerce.number().int().optional(),
  round: z.coerce.number().int().optional(),
  category: z.string().toUpperCase().optional(),
  gender: z.string().toUpperCase().optional(),
  maxRank: z.coerce.number().int().optional(),
  minRank: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
