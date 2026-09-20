import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { humanize } from "@/lib/utils";
import { Badge, Container, DemoBadge, EmptyState, PageHeader } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";

export const metadata: Metadata = { title: "Student clubs", description: "Coding, robotics, IEEE, entrepreneurship, NSS, NCC, cultural and sports clubs across VTU engineering colleges." };
export const dynamic = "force-dynamic";
const CATS = ["TECHNICAL", "CULTURAL", "SPORTS", "SOCIAL", "ENTREPRENEURSHIP", "PROFESSIONAL", "OTHER"] as const;

export default async function ClubsPage({ searchParams }: { searchParams: Promise<{ category?: string; college?: string }> }) {
  const { category, college } = await searchParams;
  const [clubs, colleges] = await Promise.all([
    prisma.club.findMany({
      where: {
        ...(category && CATS.includes(category as (typeof CATS)[number]) ? { category: category as (typeof CATS)[number] } : {}),
        ...(college ? { college: { slug: college } } : {}),
      },
      orderBy: [{ name: "asc" }],
      take: 300,
      include: { college: { select: { slug: true, name: true, shortName: true, city: true } } },
    }),
    prisma.college.findMany({ select: { slug: true, shortName: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const byName = new Map<string, typeof clubs>();
  for (const c of clubs) {
    if (!byName.has(c.name)) byName.set(c.name, []);
    byName.get(c.name)!.push(c);
  }

  return (
    <Container className="py-8">
      <PageHeader title="Student clubs" description="Clubs grouped by name so you can see which colleges run a coding club, IEEE branch, E-cell, NSS unit and more.">
        <div className="flex gap-2">
          <AutoSubmitSelect param="category" defaultValue={category ?? ""} className="w-44" aria-label="Category">
            <option value="">All categories</option>
            {CATS.map((c) => (
              <option key={c} value={c}>
                {humanize(c)}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect param="college" defaultValue={college ?? ""} className="w-48" aria-label="College">
            <option value="">All colleges</option>
            {colleges.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.shortName ?? c.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
      </PageHeader>
      {clubs.length === 0 ? (
        <EmptyState title="No clubs recorded for these filters" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(byName.entries()).map(([name, list]) => (
            <article key={name} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{name}</h3>
                <Badge>{humanize(list[0].category)}</Badge>
              </div>
              {list[0].description && <p className="mt-1 text-xs text-muted">{list[0].activities.join(" · ")}</p>}
              <ul className="mt-3 space-y-1 text-sm">
                {list.map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <Link href={`/college/${c.college.slug}?tab=clubs`} className="hover:text-primary">
                      {c.college.shortName ?? c.college.name} <span className="text-xs text-muted">· {c.college.city}</span>
                    </Link>
                    {c.isDemo && <DemoBadge />}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}
