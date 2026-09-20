-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "CollegeType" AS ENUM ('GOVERNMENT', 'AIDED', 'PRIVATE', 'UNIVERSITY', 'DEEMED');

-- CreateEnum
CREATE TYPE "Quota" AS ENUM ('KCET', 'COMEDK', 'MANAGEMENT', 'NRI', 'OTHER');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('GENERAL', 'HYDERABAD_KARNATAKA', 'RURAL', 'KANNADA_MEDIUM', 'SNQ', 'OTHER');

-- CreateEnum
CREATE TYPE "FacilityCategory" AS ENUM ('ACADEMIC', 'LIBRARY', 'SPORTS', 'MEDICAL', 'TRANSPORT', 'DINING', 'TECHNOLOGY', 'SECURITY', 'RESIDENTIAL', 'RECREATION', 'OTHER');

-- CreateEnum
CREATE TYPE "HostelType" AS ENUM ('BOYS', 'GIRLS', 'COED');

-- CreateEnum
CREATE TYPE "RecruiterSector" AS ENUM ('IT', 'CORE', 'ELECTRONICS', 'CONSULTING', 'FINANCE', 'AUTOMOTIVE', 'MANUFACTURING', 'STARTUP', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TECHNICAL_FEST', 'CULTURAL_FEST', 'SPORTS', 'WORKSHOP', 'SEMINAR', 'CONFERENCE', 'HACKATHON', 'CODING_COMPETITION', 'STUDENT_ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ClubCategory" AS ENUM ('TECHNICAL', 'CULTURAL', 'SPORTS', 'SOCIAL', 'ENTREPRENEURSHIP', 'PROFESSIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BranchCategory" AS ENUM ('COMPUTING', 'ELECTRONICS', 'ELECTRICAL', 'MECHANICAL', 'CIVIL', 'CHEMICAL', 'AEROSPACE', 'BIOTECH', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kcetRank" INTEGER,
    "category" TEXT,
    "gender" TEXT,
    "preferredBranches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredDistricts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "collegeTypePref" TEXT,
    "budgetMax" INTEGER,
    "hostelRequired" BOOLEAN NOT NULL DEFAULT false,
    "placementImportance" INTEGER NOT NULL DEFAULT 3,
    "campusPreference" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "publisher" TEXT,
    "publicationYear" INTEGER,
    "lastVerifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "establishedYear" INTEGER,
    "type" "CollegeType" NOT NULL DEFAULT 'PRIVATE',
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "pincode" TEXT,
    "affiliation" TEXT NOT NULL DEFAULT 'Visvesvaraya Technological University (VTU)',
    "university" TEXT,
    "accreditation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "autonomous" BOOLEAN NOT NULL DEFAULT false,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "history" TEXT,
    "vision" TEXT,
    "mission" TEXT,
    "principal" TEXT,
    "campusAcres" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "hostelAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "about" TEXT,
    "hod" TEXT,
    "researchAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "studentActivities" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "category" "BranchCategory" NOT NULL DEFAULT 'OTHER',
    "durationYears" INTEGER NOT NULL DEFAULT 4,
    "about" TEXT,
    "subjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "higherStudies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeBranch" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "departmentId" TEXT,
    "intake" INTEGER,
    "startedYear" INTEGER,
    "nbaAccredited" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CollegeBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cutoff" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'ALL',
    "seatType" "SeatType" NOT NULL DEFAULT 'GENERAL',
    "openingRank" INTEGER,
    "closingRank" INTEGER NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cutoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "branchId" TEXT,
    "year" INTEGER NOT NULL,
    "quota" "Quota" NOT NULL DEFAULT 'KCET',
    "tuitionFee" INTEGER NOT NULL,
    "universityFee" INTEGER NOT NULL DEFAULT 0,
    "examFee" INTEGER NOT NULL DEFAULT 0,
    "otherFee" INTEGER NOT NULL DEFAULT 0,
    "hostelFee" INTEGER,
    "messFee" INTEGER,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "qualification" TEXT,
    "specialization" TEXT,
    "researchInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceYears" INTEGER,
    "profileUrl" TEXT,
    "publications" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FacilityCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laboratory" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Laboratory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "type" "HostelType" NOT NULL,
    "name" TEXT,
    "capacity" INTEGER,
    "feePerYear" INTEGER,
    "messFeePerYear" INTEGER,
    "wifi" BOOLEAN,
    "studyArea" BOOLEAN,
    "security" TEXT,
    "rules" TEXT,
    "distanceFromCampus" TEXT,
    "transport" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "year" INTEGER NOT NULL,
    "placementPercent" DOUBLE PRECISION,
    "studentsPlaced" INTEGER,
    "studentsEligible" INTEGER,
    "highestPackage" DOUBLE PRECISION,
    "averagePackage" DOUBLE PRECISION,
    "medianPackage" DOUBLE PRECISION,
    "lowestPackage" DOUBLE PRECISION,
    "recruitersCount" INTEGER,
    "internshipInfo" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" "RecruiterSector" NOT NULL DEFAULT 'OTHER',
    "website" TEXT,

    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeRecruiter" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "year" INTEGER,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CollegeRecruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "type" "EventType" NOT NULL DEFAULT 'OTHER',
    "date" TIMESTAMP(3),
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "results" TEXT,
    "participants" INTEGER,
    "imageUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hackathon" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "organizer" TEXT,
    "participants" INTEGER,
    "winners" TEXT,
    "projects" TEXT,
    "sponsors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "link" TEXT,
    "imageUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "category" "ClubCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "activities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT,
    "contactLink" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeImage" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "credit" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CollegeImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shortlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "branchId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "collegeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollegeReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "rowsTotal" INTEGER NOT NULL,
    "rowsImported" INTEGER NOT NULL,
    "rowsSkipped" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "College_slug_key" ON "College"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "College_code_key" ON "College"("code");

-- CreateIndex
CREATE INDEX "College_district_idx" ON "College"("district");

-- CreateIndex
CREATE INDEX "College_type_idx" ON "College"("type");

-- CreateIndex
CREATE INDEX "College_name_idx" ON "College"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_collegeId_slug_key" ON "Department"("collegeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeBranch_collegeId_branchId_key" ON "CollegeBranch"("collegeId", "branchId");

-- CreateIndex
CREATE INDEX "Cutoff_branchId_year_category_idx" ON "Cutoff"("branchId", "year", "category");

-- CreateIndex
CREATE INDEX "Cutoff_year_category_closingRank_idx" ON "Cutoff"("year", "category", "closingRank");

-- CreateIndex
CREATE UNIQUE INDEX "Cutoff_collegeId_branchId_year_round_category_gender_seatTy_key" ON "Cutoff"("collegeId", "branchId", "year", "round", "category", "gender", "seatType");

-- CreateIndex
CREATE INDEX "Fee_collegeId_year_quota_idx" ON "Fee"("collegeId", "year", "quota");

-- CreateIndex
CREATE INDEX "Faculty_collegeId_idx" ON "Faculty"("collegeId");

-- CreateIndex
CREATE INDEX "Facility_collegeId_idx" ON "Facility"("collegeId");

-- CreateIndex
CREATE INDEX "Laboratory_collegeId_idx" ON "Laboratory"("collegeId");

-- CreateIndex
CREATE INDEX "Hostel_collegeId_idx" ON "Hostel"("collegeId");

-- CreateIndex
CREATE INDEX "Placement_year_idx" ON "Placement"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_collegeId_departmentId_year_key" ON "Placement"("collegeId", "departmentId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_name_key" ON "Recruiter"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeRecruiter_collegeId_recruiterId_year_key" ON "CollegeRecruiter"("collegeId", "recruiterId", "year");

-- CreateIndex
CREATE INDEX "Event_collegeId_year_idx" ON "Event"("collegeId", "year");

-- CreateIndex
CREATE INDEX "Hackathon_collegeId_year_idx" ON "Hackathon"("collegeId", "year");

-- CreateIndex
CREATE INDEX "Club_collegeId_idx" ON "Club"("collegeId");

-- CreateIndex
CREATE INDEX "Achievement_collegeId_year_idx" ON "Achievement"("collegeId", "year");

-- CreateIndex
CREATE INDEX "Milestone_collegeId_year_idx" ON "Milestone"("collegeId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Shortlist_userId_collegeId_key" ON "Shortlist"("userId", "collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeReview_userId_collegeId_key" ON "CollegeReview"("userId", "collegeId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "College" ADD CONSTRAINT "College_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeBranch" ADD CONSTRAINT "CollegeBranch_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeBranch" ADD CONSTRAINT "CollegeBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeBranch" ADD CONSTRAINT "CollegeBranch_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cutoff" ADD CONSTRAINT "Cutoff_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cutoff" ADD CONSTRAINT "Cutoff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cutoff" ADD CONSTRAINT "Cutoff_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laboratory" ADD CONSTRAINT "Laboratory_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laboratory" ADD CONSTRAINT "Laboratory_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laboratory" ADD CONSTRAINT "Laboratory_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hostel" ADD CONSTRAINT "Hostel_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hostel" ADD CONSTRAINT "Hostel_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeRecruiter" ADD CONSTRAINT "CollegeRecruiter_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeRecruiter" ADD CONSTRAINT "CollegeRecruiter_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hackathon" ADD CONSTRAINT "Hackathon_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hackathon" ADD CONSTRAINT "Hackathon_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeImage" ADD CONSTRAINT "CollegeImage_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeReview" ADD CONSTRAINT "CollegeReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeReview" ADD CONSTRAINT "CollegeReview_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLog" ADD CONSTRAINT "ImportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
