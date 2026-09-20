import { prisma } from "@/lib/prisma";
import { fail, handler, ok } from "@/lib/api";
import { getCollegeCutoffs } from "@/lib/data/cutoffs";

const RESOURCES = [
  "cutoffs", "fees", "faculty", "placements", "events", "hackathons", "clubs", "labs",
  "facilities", "hostels", "departments", "recruiters", "achievements", "milestones", "branches",
] as const;
type Resource = (typeof RESOURCES)[number];

/** GET /api/colleges/:slug/:resource — one sub-collection of a college. */
export const GET = handler(async (req, ctx: { params: Promise<{ slug: string; resource: string }> }) => {
  const { slug, resource } = await ctx.params;
  if (!RESOURCES.includes(resource as Resource)) return fail(404, "Unknown resource: " + resource);
  const college = await prisma.college.findFirst({ where: { OR: [{ slug }, { code: slug.toUpperCase() }] }, select: { id: true } });
  if (!college) return fail(404, "College not found");
  const url = new URL(req.url);
  const id = college.id;

  switch (resource as Resource) {
    case "cutoffs": {
      const branch = url.searchParams.get("branch");
      const branchRow = branch
        ? await prisma.branch.findFirst({ where: { OR: [{ slug: branch }, { code: branch.toUpperCase() }] }, select: { id: true } })
        : null;
      return ok(await getCollegeCutoffs(id, branchRow?.id));
    }
    case "fees":
      return ok(await prisma.fee.findMany({ where: { collegeId: id }, orderBy: [{ year: "desc" }, { quota: "asc" }], include: { branch: { select: { shortName: true } }, source: true } }));
    case "faculty":
      return ok(await prisma.faculty.findMany({ where: { collegeId: id }, orderBy: { name: "asc" }, include: { department: { select: { name: true } }, source: true } }));
    case "placements":
      return ok(await prisma.placement.findMany({ where: { collegeId: id }, orderBy: { year: "desc" }, include: { department: { select: { name: true } }, source: true } }));
    case "events":
      return ok(await prisma.event.findMany({ where: { collegeId: id }, orderBy: [{ year: "desc" }, { date: "desc" }], include: { source: true } }));
    case "hackathons":
      return ok(await prisma.hackathon.findMany({ where: { collegeId: id }, orderBy: { year: "desc" }, include: { source: true } }));
    case "clubs":
      return ok(await prisma.club.findMany({ where: { collegeId: id }, orderBy: { name: "asc" }, include: { source: true } }));
    case "labs":
      return ok(await prisma.laboratory.findMany({ where: { collegeId: id }, orderBy: { name: "asc" }, include: { department: { select: { name: true } }, source: true } }));
    case "facilities":
      return ok(await prisma.facility.findMany({ where: { collegeId: id }, orderBy: { category: "asc" }, include: { source: true } }));
    case "hostels":
      return ok(await prisma.hostel.findMany({ where: { collegeId: id }, include: { source: true } }));
    case "departments":
      return ok(await prisma.department.findMany({ where: { collegeId: id }, orderBy: { name: "asc" }, include: { source: true } }));
    case "recruiters":
      return ok(await prisma.collegeRecruiter.findMany({ where: { collegeId: id }, include: { recruiter: true } }));
    case "achievements":
      return ok(await prisma.achievement.findMany({ where: { collegeId: id }, orderBy: { year: "desc" }, include: { source: true } }));
    case "milestones":
      return ok(await prisma.milestone.findMany({ where: { collegeId: id }, orderBy: { year: "asc" }, include: { source: true } }));
    case "branches":
      return ok(await prisma.collegeBranch.findMany({ where: { collegeId: id }, include: { branch: true, department: { select: { name: true, slug: true } } } }));
  }
});
