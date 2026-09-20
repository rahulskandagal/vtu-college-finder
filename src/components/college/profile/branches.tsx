import Link from "next/link";
import type { CollegeProfile } from "@/lib/data/colleges";
import type { BranchStat } from "./tabs";
import { formatRank, humanize } from "@/lib/utils";
import { Badge, DemoBadge, EmptyState, LinkButton } from "@/components/ui";

export function BranchesTab({ college, branchStats }: { college: CollegeProfile; branchStats: BranchStat[] }) {
  if (college.branches.length === 0) return <EmptyState title="No branches recorded for this college" />;
  const statsByBranch = new Map(branchStats.map((b) => [b.branchId, b.stats]));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {college.branches
        .slice()
        .sort((a, b) => a.branch.name.localeCompare(b.branch.name))
        .map((cb) => {
          const s = statsByBranch.get(cb.branchId);
          return (
            <article key={cb.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    <Link href={`/college/${college.slug}/${cb.branch.slug}`} className="hover:text-primary">
                      {cb.branch.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted">
                    {cb.branch.shortName} · {humanize(cb.branch.category)} · {cb.branch.durationYears} years
                    {cb.department && <> · {cb.department.name}</>}
                  </p>
                </div>
                <div className="flex gap-1">
                  {cb.isDemo && <DemoBadge />}
                  {cb.nbaAccredited && <Badge tone="accent">NBA</Badge>}
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted">Intake</dt>
                  <dd className="text-sm font-semibold">{cb.intake ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Latest GM closing</dt>
                  <dd className="text-sm font-semibold">{s?.latest ? `${formatRank(s.latest.finalClosing)} (${s.latest.year})` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted">3-yr range</dt>
                  <dd className="text-sm font-semibold">{s?.recentMin != null ? `${formatRank(s.recentMin)} – ${formatRank(s.recentMax)}` : "—"}</dd>
                </div>
              </dl>
              {cb.branch.about && <p className="mt-3 line-clamp-2 text-sm text-slate-700">{cb.branch.about}</p>}
              <div className="mt-3 flex gap-2">
                <LinkButton href={`/college/${college.slug}/${cb.branch.slug}`} size="sm" variant="secondary">
                  Branch at this college
                </LinkButton>
                <LinkButton href={`/branches/${cb.branch.slug}`} size="sm" variant="ghost">
                  About {cb.branch.shortName}
                </LinkButton>
              </div>
            </article>
          );
        })}
    </div>
  );
}
