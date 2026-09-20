import { z } from "zod";
import {
  idSchema,
  optionalFloat,
  optionalInt,
  optionalString,
  optionalUrl,
  stringArray,
  yearSchema,
} from "./common";

const bool = z.coerce.boolean().default(false);
const sourceRef = z.object({ sourceId: idSchema.optional().nullable(), isDemo: bool.optional() });

export const sourceSchema = z.object({
  name: z.string().trim().min(2).max(200),
  url: optionalUrl,
  publisher: optionalString(100),
  publicationYear: optionalInt,
  lastVerifiedAt: z.coerce.date().optional().nullable(),
  notes: optionalString(2000),
  isDemo: bool,
});

export const collegeSchema = z
  .object({
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(2).max(80).optional(),
    code: z.string().trim().toUpperCase().min(2).max(10),
    name: z.string().trim().min(3).max(200),
    shortName: optionalString(30),
    establishedYear: optionalInt,
    type: z.enum(["GOVERNMENT", "AIDED", "PRIVATE", "UNIVERSITY", "DEEMED"]).default("PRIVATE"),
    district: z.string().trim().min(2).max(60),
    city: z.string().trim().min(2).max(60),
    address: optionalString(300),
    pincode: optionalString(10),
    affiliation: z.string().trim().max(200).default("Visvesvaraya Technological University (VTU)"),
    university: optionalString(200),
    accreditation: stringArray,
    autonomous: bool,
    website: optionalUrl,
    email: optionalString(200),
    phone: optionalString(50),
    description: optionalString(5000),
    history: optionalString(10000),
    vision: optionalString(2000),
    mission: optionalString(2000),
    principal: optionalString(120),
    campusAcres: optionalFloat,
    imageUrl: optionalUrl,
    hostelAvailable: bool,
    lastVerifiedAt: z.coerce.date().optional().nullable(),
  })
  .merge(sourceRef);

export const branchSchema = z.object({
  code: z.string().trim().toUpperCase().min(1).max(10),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(2).max(60),
  name: z.string().trim().min(3).max(150),
  shortName: z.string().trim().min(1).max(20),
  category: z
    .enum(["COMPUTING", "ELECTRONICS", "ELECTRICAL", "MECHANICAL", "CIVIL", "CHEMICAL", "AEROSPACE", "BIOTECH", "OTHER"])
    .default("OTHER"),
  durationYears: z.coerce.number().int().min(3).max(6).default(4),
  about: optionalString(5000),
  subjects: stringArray,
  careers: stringArray,
  higherStudies: stringArray,
  skills: stringArray,
});

export const departmentSchema = z
  .object({
    collegeId: idSchema,
    name: z.string().trim().min(2).max(150),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(2).max(60),
    about: optionalString(5000),
    hod: optionalString(120),
    researchAreas: stringArray,
    studentActivities: optionalString(2000),
  })
  .merge(sourceRef);

export const collegeBranchSchema = z.object({
  collegeId: idSchema,
  branchId: idSchema,
  departmentId: idSchema.optional().nullable(),
  intake: optionalInt,
  startedYear: optionalInt,
  nbaAccredited: bool,
  isDemo: bool.optional(),
});

export const cutoffSchema = z
  .object({
    collegeId: idSchema,
    branchId: idSchema,
    year: yearSchema,
    round: z.coerce.number().int().min(1).max(5).default(1),
    category: z.string().trim().toUpperCase().min(1).max(10),
    gender: z.enum(["ALL", "MALE", "FEMALE"]).default("ALL"),
    seatType: z
      .enum(["GENERAL", "HYDERABAD_KARNATAKA", "RURAL", "KANNADA_MEDIUM", "SNQ", "OTHER"])
      .default("GENERAL"),
    openingRank: optionalInt,
    closingRank: z.coerce.number().int().min(1).max(500000),
  })
  .merge(sourceRef)
  .refine((v) => v.openingRank === null || v.openingRank <= v.closingRank, {
    message: "Opening rank must be less than or equal to closing rank",
    path: ["openingRank"],
  });

export const feeSchema = z
  .object({
    collegeId: idSchema,
    branchId: idSchema.optional().nullable(),
    year: yearSchema,
    quota: z.enum(["KCET", "COMEDK", "MANAGEMENT", "NRI", "OTHER"]).default("KCET"),
    tuitionFee: z.coerce.number().int().min(0).max(10_000_000),
    universityFee: z.coerce.number().int().min(0).default(0),
    examFee: z.coerce.number().int().min(0).default(0),
    otherFee: z.coerce.number().int().min(0).default(0),
    hostelFee: optionalInt,
    messFee: optionalInt,
    notes: optionalString(1000),
  })
  .merge(sourceRef);

export const facultySchema = z
  .object({
    collegeId: idSchema,
    departmentId: idSchema.optional().nullable(),
    name: z.string().trim().min(2).max(120),
    designation: optionalString(100),
    qualification: optionalString(200),
    specialization: optionalString(200),
    researchInterests: stringArray,
    experienceYears: optionalInt,
    profileUrl: optionalUrl,
    publications: optionalString(2000),
  })
  .merge(sourceRef);

export const facilitySchema = z
  .object({
    collegeId: idSchema,
    name: z.string().trim().min(2).max(120),
    category: z
      .enum(["ACADEMIC", "LIBRARY", "SPORTS", "MEDICAL", "TRANSPORT", "DINING", "TECHNOLOGY", "SECURITY", "RESIDENTIAL", "RECREATION", "OTHER"])
      .default("OTHER"),
    description: optionalString(2000),
  })
  .merge(sourceRef);

export const laboratorySchema = z
  .object({
    collegeId: idSchema,
    departmentId: idSchema.optional().nullable(),
    name: z.string().trim().min(2).max(120),
    purpose: optionalString(1000),
    equipment: stringArray,
    imageUrl: optionalUrl,
  })
  .merge(sourceRef);

export const hostelSchema = z
  .object({
    collegeId: idSchema,
    type: z.enum(["BOYS", "GIRLS", "COED"]),
    name: optionalString(100),
    capacity: optionalInt,
    feePerYear: optionalInt,
    messFeePerYear: optionalInt,
    wifi: z.coerce.boolean().optional().nullable(),
    studyArea: z.coerce.boolean().optional().nullable(),
    security: optionalString(300),
    rules: optionalString(2000),
    distanceFromCampus: optionalString(100),
    transport: optionalString(300),
  })
  .merge(sourceRef);

export const placementSchema = z
  .object({
    collegeId: idSchema,
    departmentId: idSchema.optional().nullable(),
    year: yearSchema,
    placementPercent: optionalFloat,
    studentsPlaced: optionalInt,
    studentsEligible: optionalInt,
    highestPackage: optionalFloat,
    averagePackage: optionalFloat,
    medianPackage: optionalFloat,
    lowestPackage: optionalFloat,
    recruitersCount: optionalInt,
    internshipInfo: optionalString(2000),
  })
  .merge(sourceRef);

export const recruiterSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sector: z
    .enum(["IT", "CORE", "ELECTRONICS", "CONSULTING", "FINANCE", "AUTOMOTIVE", "MANUFACTURING", "STARTUP", "OTHER"])
    .default("OTHER"),
  website: optionalUrl,
});

export const collegeRecruiterSchema = z.object({
  collegeId: idSchema,
  recruiterId: idSchema,
  year: optionalInt,
  isDemo: bool.optional(),
});

export const eventSchema = z
  .object({
    collegeId: idSchema,
    departmentId: idSchema.optional().nullable(),
    name: z.string().trim().min(2).max(150),
    type: z
      .enum(["TECHNICAL_FEST", "CULTURAL_FEST", "SPORTS", "WORKSHOP", "SEMINAR", "CONFERENCE", "HACKATHON", "CODING_COMPETITION", "STUDENT_ACTIVITY", "OTHER"])
      .default("OTHER"),
    date: z.coerce.date().optional().nullable(),
    year: yearSchema,
    description: optionalString(3000),
    results: optionalString(2000),
    participants: optionalInt,
    imageUrl: optionalUrl,
  })
  .merge(sourceRef);

export const hackathonSchema = z
  .object({
    collegeId: idSchema,
    name: z.string().trim().min(2).max(150),
    year: yearSchema,
    organizer: optionalString(150),
    participants: optionalInt,
    winners: optionalString(1000),
    projects: optionalString(2000),
    sponsors: stringArray,
    link: optionalUrl,
    imageUrl: optionalUrl,
  })
  .merge(sourceRef);

export const clubSchema = z
  .object({
    collegeId: idSchema,
    departmentId: idSchema.optional().nullable(),
    name: z.string().trim().min(2).max(120),
    category: z
      .enum(["TECHNICAL", "CULTURAL", "SPORTS", "SOCIAL", "ENTREPRENEURSHIP", "PROFESSIONAL", "OTHER"])
      .default("OTHER"),
    description: optionalString(2000),
    activities: stringArray,
    achievements: optionalString(2000),
    contactLink: optionalUrl,
  })
  .merge(sourceRef);

export const achievementSchema = z
  .object({
    collegeId: idSchema,
    year: yearSchema,
    title: z.string().trim().min(2).max(200),
    description: optionalString(2000),
  })
  .merge(sourceRef);

export const milestoneSchema = z
  .object({
    collegeId: idSchema,
    year: z.coerce.number().int().min(1800).max(2100),
    title: z.string().trim().min(2).max(200),
    description: optionalString(2000),
  })
  .merge(sourceRef);

export const collegeImageSchema = z.object({
  collegeId: idSchema,
  url: z.string().trim().url().max(500),
  caption: optionalString(200),
  credit: optionalString(200),
  isDemo: bool.optional(),
});
