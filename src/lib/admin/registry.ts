import "server-only";
import type { ZodType } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import * as A from "@/lib/validation/admin";

/**
 * Admin resource registry. Each entry maps a URL segment (`/api/admin/<key>`)
 * to a Prisma delegate, the zod schema used for create/update, the fields that
 * `?q=` searches, and the relations to include in list responses.
 */
export type ResourceDef = {
  label: string;
  schema: ZodType<Record<string, unknown>>;
  searchFields: string[];
  include?: Record<string, unknown>;
  orderBy: Record<string, "asc" | "desc">[];
  /** Fields shown in the admin table (in order). */
  columns: string[];
  /** Runs before create — e.g. derive slug. */
  beforeCreate?: (data: Record<string, unknown>) => Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: any;
};

const collegeRef = { college: { select: { name: true, shortName: true, code: true } } };
const branchRef = { branch: { select: { shortName: true, name: true } } };
const sourceRef = { source: { select: { name: true, isDemo: true } } };
const deptRef = { department: { select: { name: true } } };

export const RESOURCES: Record<string, ResourceDef> = {
  sources: {
    label: "Sources",
    schema: A.sourceSchema,
    searchFields: ["name", "publisher", "url"],
    orderBy: [{ createdAt: "desc" }],
    columns: ["name", "publisher", "publicationYear", "url", "lastVerifiedAt", "isDemo"],
    delegate: prisma.source,
  },
  colleges: {
    label: "Colleges",
    schema: A.collegeSchema,
    searchFields: ["name", "code", "district", "city", "shortName"],
    include: sourceRef,
    orderBy: [{ name: "asc" }],
    columns: ["code", "name", "district", "type", "autonomous", "hostelAvailable", "isDemo"],
    beforeCreate: (d) => ({ ...d, slug: (d.slug as string | undefined) || slugify(d.name as string) }),
    delegate: prisma.college,
  },
  branches: {
    label: "Branches",
    schema: A.branchSchema,
    searchFields: ["name", "code", "shortName"],
    orderBy: [{ category: "asc" }, { name: "asc" }],
    columns: ["code", "shortName", "name", "category", "durationYears"],
    delegate: prisma.branch,
  },
  departments: {
    label: "Departments",
    schema: A.departmentSchema,
    searchFields: ["name", "hod"],
    include: { ...collegeRef, ...sourceRef },
    orderBy: [{ name: "asc" }],
    columns: ["college", "name", "hod", "isDemo"],
    delegate: prisma.department,
  },
  "college-branches": {
    label: "College ↔ Branch",
    schema: A.collegeBranchSchema,
    searchFields: [],
    include: { ...collegeRef, ...branchRef, ...deptRef },
    orderBy: [{ collegeId: "asc" }],
    columns: ["college", "branch", "intake", "startedYear", "nbaAccredited"],
    delegate: prisma.collegeBranch,
  },
  cutoffs: {
    label: "Cutoffs",
    schema: A.cutoffSchema,
    searchFields: ["category"],
    include: { ...collegeRef, ...branchRef, ...sourceRef },
    orderBy: [{ year: "desc" }, { round: "asc" }],
    columns: ["college", "branch", "year", "round", "category", "gender", "seatType", "openingRank", "closingRank", "isDemo"],
    delegate: prisma.cutoff,
  },
  fees: {
    label: "Fees",
    schema: A.feeSchema,
    searchFields: ["notes"],
    include: { ...collegeRef, ...branchRef, ...sourceRef },
    orderBy: [{ year: "desc" }],
    columns: ["college", "branch", "year", "quota", "tuitionFee", "universityFee", "examFee", "otherFee", "hostelFee", "isDemo"],
    delegate: prisma.fee,
  },
  faculty: {
    label: "Faculty",
    schema: A.facultySchema,
    searchFields: ["name", "designation", "specialization"],
    include: { ...collegeRef, ...deptRef, ...sourceRef },
    orderBy: [{ name: "asc" }],
    columns: ["college", "department", "name", "designation", "qualification", "isDemo"],
    delegate: prisma.faculty,
  },
  facilities: {
    label: "Facilities",
    schema: A.facilitySchema,
    searchFields: ["name", "description"],
    include: { ...collegeRef, ...sourceRef },
    orderBy: [{ category: "asc" }],
    columns: ["college", "name", "category", "isDemo"],
    delegate: prisma.facility,
  },
  laboratories: {
    label: "Laboratories",
    schema: A.laboratorySchema,
    searchFields: ["name", "purpose"],
    include: { ...collegeRef, ...deptRef, ...sourceRef },
    orderBy: [{ name: "asc" }],
    columns: ["college", "department", "name", "isDemo"],
    delegate: prisma.laboratory,
  },
  hostels: {
    label: "Hostels",
    schema: A.hostelSchema,
    searchFields: ["name"],
    include: { ...collegeRef, ...sourceRef },
    orderBy: [{ collegeId: "asc" }],
    columns: ["college", "type", "capacity", "feePerYear", "messFeePerYear", "isDemo"],
    delegate: prisma.hostel,
  },
  placements: {
    label: "Placements",
    schema: A.placementSchema,
    searchFields: [],
    include: { ...collegeRef, ...deptRef, ...sourceRef },
    orderBy: [{ year: "desc" }],
    columns: ["college", "department", "year", "placementPercent", "highestPackage", "averagePackage", "medianPackage", "isDemo"],
    delegate: prisma.placement,
  },
  recruiters: {
    label: "Recruiters",
    schema: A.recruiterSchema,
    searchFields: ["name"],
    orderBy: [{ name: "asc" }],
    columns: ["name", "sector", "website"],
    delegate: prisma.recruiter,
  },
  "college-recruiters": {
    label: "College ↔ Recruiter",
    schema: A.collegeRecruiterSchema,
    searchFields: [],
    include: { ...collegeRef, recruiter: { select: { name: true, sector: true } } },
    orderBy: [{ collegeId: "asc" }],
    columns: ["college", "recruiter", "year", "isDemo"],
    delegate: prisma.collegeRecruiter,
  },
  events: {
    label: "Events",
    schema: A.eventSchema,
    searchFields: ["name", "description"],
    include: { ...collegeRef, ...deptRef, ...sourceRef },
    orderBy: [{ year: "desc" }],
    columns: ["college", "name", "type", "year", "participants", "isDemo"],
    delegate: prisma.event,
  },
  hackathons: {
    label: "Hackathons",
    schema: A.hackathonSchema,
    searchFields: ["name", "organizer"],
    include: { ...collegeRef, ...sourceRef },
    orderBy: [{ year: "desc" }],
    columns: ["college", "name", "year", "organizer", "participants", "isDemo"],
    delegate: prisma.hackathon,
  },
  clubs: {
    label: "Clubs",
    schema: A.clubSchema,
    searchFields: ["name", "description"],
    include: { ...collegeRef, ...deptRef, ...sourceRef },
    orderBy: [{ name: "asc" }],
    columns: ["college", "name", "category", "isDemo"],
    delegate: prisma.club,
  },
  achievements: {
    label: "Achievements",
    schema: A.achievementSchema,
    searchFields: ["title", "description"],
    include: { ...collegeRef, ...sourceRef },
    orderBy: [{ year: "desc" }],
    columns: ["college", "year", "title", "isDemo"],
    delegate: prisma.achievement,
  },
  milestones: {
    label: "Milestones (history)",
    schema: A.milestoneSchema,
    searchFields: ["title", "description"],
    include: { ...collegeRef, ...sourceRef },
    orderBy: [{ year: "asc" }],
    columns: ["college", "year", "title", "isDemo"],
    delegate: prisma.milestone,
  },
  images: {
    label: "College images",
    schema: A.collegeImageSchema,
    searchFields: ["caption", "credit"],
    include: collegeRef,
    orderBy: [{ collegeId: "asc" }],
    columns: ["college", "url", "caption", "credit"],
    delegate: prisma.collegeImage,
  },
};

export type ResourceKey = keyof typeof RESOURCES;

export function getResource(key: string): ResourceDef | null {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key) ? RESOURCES[key] : null;
}
