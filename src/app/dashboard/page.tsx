import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getCardsByIds } from "@/lib/data/colleges";
import { Card, CardBody, CardHeader, Container, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ShortlistList, ComparisonList } from "@/components/dashboard/lists";
import { formatRank } from "@/lib/utils";

export const metadata: Metadata = { title: "My dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const [profile, shortlist, comparisons, branches] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: session.id } }),
    prisma.shortlist.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" }, include: { branch: { select: { shortName: true, slug: true } } } }),
    prisma.comparison.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } }),
    prisma.branch.findMany({ select: { slug: true, shortName: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const cards = await getCardsByIds(shortlist.map((s) => s.collegeId));
  const compIds = Array.from(new Set(comparisons.flatMap((c) => c.collegeIds)));
  const compColleges = await prisma.college.findMany({ where: { id: { in: compIds } }, select: { id: true, slug: true, name: true, shortName: true } });

  const findHref = profile?.kcetRank
    ? `/find?rank=${profile.kcetRank}&category=${profile.category ?? "GM"}${profile.preferredBranches.length ? `&branches=${profile.preferredBranches.join(",")}` : ""}${profile.preferredDistricts.length ? `&districts=${profile.preferredDistricts.join(",")}` : ""}${profile.hostelRequired ? "&hostel=1" : ""}${profile.budgetMax ? `&maxFee=${profile.budgetMax}` : ""}`
    : "/find";

  return (
    <Container className="py-8">
      <PageHeader title={`Hello, ${session.name.split(" ")[0]}`} description={profile?.kcetRank ? `Saved rank ${formatRank(profile.kcetRank)} · ${profile.category ?? "GM"}` : "Save your KCET rank and preferences to get a personalised college list."}>
        <LinkButton href={findHref} size="sm">
          {profile?.kcetRank ? "Colleges for my rank" : "Find colleges"}
        </LinkButton>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="My college shortlist" subtitle={`${cards.length} college${cards.length === 1 ? "" : "s"}`} />
            <CardBody>
              {cards.length === 0 ? (
                <EmptyState title="No colleges shortlisted yet" description="Use the Shortlist button on any college card or profile." />
              ) : (
                <ShortlistList
                  items={cards.map((c) => ({ ...c, note: shortlist.find((s) => s.collegeId === c.id)?.note ?? null, branch: shortlist.find((s) => s.collegeId === c.id)?.branch ?? null }))}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="My comparisons" action={<Link href="/compare" className="text-sm text-primary hover:underline">New comparison</Link>} />
            <CardBody>
              {comparisons.length === 0 ? (
                <EmptyState title="No saved comparisons" description="Open Compare, pick colleges and click “Save comparison”." />
              ) : (
                <ComparisonList items={comparisons.map((c) => ({ id: c.id, name: c.name, createdAt: c.createdAt.toISOString(), colleges: c.collegeIds.map((id) => compColleges.find((x) => x.id === id)).filter((x): x is (typeof compColleges)[number] => !!x) }))} />
              )}
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="My KCET profile" subtitle="Used to pre-fill the rank finder." />
          <CardBody>
            <ProfileForm
              branches={branches}
              initial={
                profile
                  ? {
                      kcetRank: profile.kcetRank,
                      category: profile.category,
                      gender: profile.gender,
                      preferredBranches: profile.preferredBranches,
                      preferredDistricts: profile.preferredDistricts,
                      budgetMax: profile.budgetMax,
                      hostelRequired: profile.hostelRequired,
                      placementImportance: profile.placementImportance,
                      collegeTypePref: profile.collegeTypePref,
                    }
                  : null
              }
            />
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
