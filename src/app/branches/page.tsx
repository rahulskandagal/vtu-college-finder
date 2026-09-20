import type { Metadata } from "next";
import Link from "next/link";
import { listBranches } from "@/lib/data/branches";
import { humanize } from "@/lib/utils";
import { Badge, Container, LinkButton, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Engineering branches",
  description: "Explore VTU engineering branches — subjects, careers, higher studies, skills and which colleges offer them.",
};
export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const branches = await listBranches();
  const groups = new Map<string, typeof branches>();
  for (const b of branches) {
    if (!groups.has(b.category)) groups.set(b.category, []);
    groups.get(b.category)!.push(b);
  }
  return (
    <Container className="py-8">
      <PageHeader title="Engineering branches" description="What each branch teaches, where it leads, and how competitive it has been in KCET.">
        <LinkButton href="/compare/branches" variant="secondary" size="sm">
          Compare branches
        </LinkButton>
      </PageHeader>
      {Array.from(groups.entries()).map(([cat, list]) => (
        <section key={cat} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{humanize(cat)}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b) => (
              <Link key={b.id} href={`/branches/${b.slug}`} className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{b.name}</h3>
                  <Badge tone="primary">{b.shortName}</Badge>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-slate-700">{b.about ?? "Information not available"}</p>
                <p className="mt-3 text-xs text-muted">
                  {b.durationYears} years · offered by {b._count.colleges} college{b._count.colleges === 1 ? "" : "s"} in the database
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Container>
  );
}
