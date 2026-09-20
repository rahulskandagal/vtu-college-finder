# Database schema

PostgreSQL, managed by Prisma (`prisma/schema.prisma`, migrations in `prisma/migrations/`).

## Design principles

- **Provenance everywhere.** Every content model has `sourceId → Source` (name, URL, publisher, publication year, last-verified date) plus `isDemo`. The UI renders a source note and a *Demo data* badge from these fields; empty fields render as *Information not available*.
- **History is first-class.** Cutoffs, fees and placements are keyed by `year` (and round / quota) so ten or more years can be stored side by side. Milestones and achievements give the institutional timeline.
- **Fees are never mixed.** `Fee.quota` (`KCET | COMEDK | MANAGEMENT | NRI | OTHER`) separates admission routes; `branchId = null` means college-wide.
- **Cutoff uniqueness.** `(collegeId, branchId, year, round, category, gender, seatType)` is unique, which is what the CSV importer uses to detect duplicates and `overwrite`.
- **Cascade rules.** Deleting a college removes all of its child records; deleting a source sets `sourceId` to null (data is kept, provenance lost — the UI then shows "Source: not recorded").

## Entity relationships

```
User ─┬─ StudentProfile (1:1)
      ├─ Shortlist[] ──→ College, Branch?
      ├─ Comparison[] (collegeIds[])
      ├─ CollegeReview[] ──→ College
      └─ ImportLog[]

Source ──< (College, Department, Cutoff, Fee, Faculty, Facility, Laboratory,
            Hostel, Placement, Event, Hackathon, Club, Achievement, Milestone)

College ─┬─ Department[] ─┬─ CollegeBranch[] ──→ Branch
         │                ├─ Faculty[]
         │                ├─ Laboratory[]
         │                ├─ Placement[] (department-wise)
         │                ├─ Event[]
         │                └─ Club[]
         ├─ CollegeBranch[] ──→ Branch
         ├─ Cutoff[] ──→ Branch
         ├─ Fee[] ──→ Branch?
         ├─ Faculty[]
         ├─ Facility[]
         ├─ Laboratory[]
         ├─ Hostel[]
         ├─ Placement[] (college-wide when departmentId is null)
         ├─ CollegeRecruiter[] ──→ Recruiter
         ├─ Event[]
         ├─ Hackathon[]
         ├─ Club[]
         ├─ Achievement[]
         ├─ Milestone[]
         └─ CollegeImage[]

Branch (master list) ──< CollegeBranch, Cutoff, Fee, Shortlist
Recruiter ──< CollegeRecruiter
```

## Models

| Model | Purpose | Key fields |
| --- | --- | --- |
| `User` | Accounts | `email` (unique), `passwordHash`, `role` (`STUDENT`/`ADMIN`) |
| `StudentProfile` | Saved KCET inputs | `kcetRank, category, gender, preferredBranches[], preferredDistricts[], budgetMax, hostelRequired, placementImportance` |
| `Source` | Provenance | `name, url, publisher, publicationYear, lastVerifiedAt, isDemo` |
| `College` | Institution | `slug` (unique URL), `code` (KEA, unique), `type`, `district`, `city`, `affiliation`, `accreditation[]`, `autonomous`, `website`, `description/history/vision/mission`, `principal`, `campusAcres`, `hostelAvailable` |
| `Department` | Academic department | `name, slug (unique per college), hod, researchAreas[], about` |
| `Branch` | VTU branch master | `code` (KEA), `slug`, `name`, `shortName`, `category`, `durationYears`, `about`, `subjects[]`, `careers[]`, `higherStudies[]`, `skills[]` |
| `CollegeBranch` | Branch offered at a college | `intake, startedYear, nbaAccredited, departmentId` — unique `(collegeId, branchId)` |
| `Cutoff` | KCET cutoff row | `year, round, category, gender (ALL/MALE/FEMALE), seatType, openingRank?, closingRank` — indexed on `(branchId, year, category)` and `(year, category, closingRank)` |
| `Fee` | Annual fee structure | `year, quota, tuitionFee, universityFee, examFee, otherFee, hostelFee?, messFee?, notes` |
| `Faculty` | Faculty directory | `name, designation, qualification, specialization, researchInterests[], experienceYears, profileUrl, publications` |
| `Facility` | Campus facility | `name, category (ACADEMIC, LIBRARY, SPORTS, …), description` |
| `Laboratory` | Department lab | `name, purpose, equipment[], imageUrl` |
| `Hostel` | Hostel block | `type (BOYS/GIRLS/COED), capacity, feePerYear, messFeePerYear, wifi, studyArea, security, rules, distanceFromCampus, transport` |
| `Placement` | Placement stats per year | `placementPercent, studentsPlaced, studentsEligible, highest/average/median/lowestPackage (LPA), recruitersCount, internshipInfo` — unique `(collegeId, departmentId, year)` |
| `Recruiter` / `CollegeRecruiter` | Companies and which colleges they visited | `name (unique), sector`, join with optional `year` |
| `Event` | Fests, workshops, seminars… | `name, type, date, year, description, results, participants, imageUrl` |
| `Hackathon` | Hackathons | `name, year, organizer, participants, winners, projects, sponsors[], link` |
| `Club` | Student clubs | `name, category, description, activities[], achievements, contactLink` |
| `Achievement` | Institutional achievements | `year, title, description` |
| `Milestone` | History timeline | `year, title, description` |
| `CollegeImage` | Gallery | `url, caption, credit` |
| `Shortlist` | Student shortlist | unique `(userId, collegeId)`, optional `branchId`, `note` |
| `Comparison` | Saved comparisons | `name, collegeIds[]` |
| `CollegeReview` | Student reviews (moderated) | `rating 1-5, text, approved` |
| `ImportLog` | Bulk import audit | `filename, entity, rowsTotal, rowsImported, rowsSkipped, status, errors (json)` |

## Enums

`Role, CollegeType, Quota, SeatType, FacilityCategory, HostelType, RecruiterSector, EventType, ClubCategory, BranchCategory, ImportStatus` — see `schema.prisma`.

## Category codes

Cutoff `category` is a free string so future KEA codes need no migration; the UI/validation know `GM, GMK, GMR, 1G, 2AG, 2BG, 3AG, 3BG, SCG, STG` (`src/lib/constants.ts`). Sub-quotas (Hyderabad-Karnataka 371J, rural, Kannada medium, SNQ) go in `seatType`.

## Migrations

```bash
npm run db:migrate            # dev: create/apply migration from schema changes
npm run db:deploy             # prod: apply committed migrations
npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script   # inspect drift
```

The Prisma client is generated into `src/generated/prisma` (git-ignored; regenerated by `npm install` via `postinstall`).

## Scaling notes

- Cutoff rows are small and indexed by branch/year/category; tens of millions of rows are fine on Postgres. The recommendation query filters by category, gender, seat type and optional college/branch/district before grouping in memory.
- `listColleges` builds cards with three batched queries (latest-year cutoffs, fees, placements) instead of per-college queries.
- Add a Redis-backed limiter (`src/lib/rate-limit.ts`) and connection pooling (PgBouncer / Prisma Accelerate) when running multiple instances.
