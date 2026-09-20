import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCollegeBySlug } from "@/lib/data/colleges";
import { getCollegeBranchStats, getCollegeCutoffs } from "@/lib/data/cutoffs";
import { getSession } from "@/lib/auth/session";
import { humanize } from "@/lib/utils";
import { Badge, Container, DemoBanner, Disclaimer } from "@/components/ui";
import { CompareToggle, ShortlistButton } from "@/components/college/actions";
import { ProfileTabs, TABS, type TabKey } from "@/components/college/profile/tabs";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { slug: string };
type SP = { tab?: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await prisma.college.findFirst({ where: { OR: [{ slug }, { code: slug.toUpperCase() }] }, select: { name: true, city: true, district: true, description: true, slug: true } });
  if (!c) return { title: "College not found" };
  const title = `${c.name}, ${c.city} — KCET cutoffs, fees, placements`;
  const description = c.description ?? `${c.name} in ${c.city}, ${c.district}: historical KCET cutoffs, fees, placements, faculty, labs, hostel, clubs and events.`;
  return {
    title,
    description,
    keywords: [c.name, `${c.name} KCET cutoff`, `${c.name} fees`, `${c.name} placements`, c.city, "VTU"],
    alternates: { canonical: `/college/${c.slug}` },
    openGraph: { title: `${title} | ${APP_NAME}`, description, type: "article" },
  };
}

export default async function CollegePage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;
  const college = await getCollegeBySlug(slug);
  if (!college) notFound();
  const tab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : "overview";

  const [cutoffs, branchStats, session] = await Promise.all([
    tab === "cutoffs" || tab === "overview" || tab === "branches" ? getCollegeCutoffs(college.id) : Promise.resolve([]),
    getCollegeBranchStats(college.id),
    getSession(),
  ]);
  const shortlisted = session ? !!(await prisma.shortlist.findUnique({ where: { userId_collegeId: { userId: session.id, collegeId: college.id } } })) : false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: college.name,
    url: college.website ?? undefined,
    address: { "@type": "PostalAddress", addressLocality: college.city, addressRegion: "Karnataka", addressCountry: "IN" },
    foundingDate: college.establishedYear ? String(college.establishedYear) : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="border-b border-border bg-white">
        <Container className="py-6">
          <nav className="mb-3 text-xs text-muted" aria-label="Breadcrumb">
            <Link href="/colleges" className="hover:text-primary">Colleges</Link> <span className="mx-1">/</span> {college.district}
          </nav>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{college.name}</h1>
                {college.autonomous && <Badge tone="accent">Autonomous</Badge>}
                <Badge>{humanize(college.type)}</Badge>
                <Badge>Code {college.code}</Badge>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {college.city}, {college.district}
                </span>
                {college.establishedYear && <span>Est. {college.establishedYear}</span>}
                <span>{college.affiliation}</span>
                {college.website && (
                  <a href={college.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    Official website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
              {college.accreditation.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {college.accreditation.map((a) => (
                    <Badge key={a} tone="primary">{a}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <CompareToggle slug={college.slug} name={college.shortName ?? college.name} size="md" />
              <ShortlistButton collegeId={college.id} initiallySaved={shortlisted} size="md" />
            </div>
          </div>
          {college.isDemo && <DemoBanner className="mt-4" />}
        </Container>
      </div>

      <Container className="py-6">
        <ProfileTabs college={college} tab={tab} cutoffs={cutoffs} branchStats={branchStats} />
        <Disclaimer className="mt-8" />
      </Container>
    </>
  );
}
