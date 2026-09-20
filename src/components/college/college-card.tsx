import Link from "next/link";
import { MapPin, Building2, Home } from "lucide-react";
import type { CollegeCardData } from "@/lib/data/colleges";
import { formatINR, formatLPA, formatPercent, formatRank, humanize } from "@/lib/utils";
import { Badge, DemoBadge, LinkButton } from "@/components/ui";
import { CompareToggle, ShortlistButton } from "./actions";

export function CollegeCard({ college, shortlisted = false }: { college: CollegeCardData; shortlisted?: boolean }) {
  const href = `/college/${college.slug}`;
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="relative block h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-600">
        {college.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={college.imageUrl} alt={college.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end p-4">
            <span className="text-3xl font-bold tracking-tight text-white/90">{college.shortName ?? college.code}</span>
          </div>
        )}
        <div className="absolute right-3 top-3 flex gap-1">
          {college.isDemo && <DemoBadge />}
          {college.autonomous && <Badge tone="accent">Autonomous</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link href={href} className="line-clamp-2 text-base font-semibold leading-snug hover:text-primary">
            {college.name}
          </Link>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {college.city}, {college.district}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {humanize(college.type)}
            </span>
            {college.hostelAvailable && (
              <span className="inline-flex items-center gap-1">
                <Home className="h-3 w-3" /> Hostel
              </span>
            )}
          </p>
        </div>

        {college.popularBranches.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {college.popularBranches.map((b) => (
              <Link key={b.slug} href={`${href}/${b.slug}`} title={b.name}>
                <Badge className="hover:bg-slate-200">{b.shortName}</Badge>
              </Link>
            ))}
          </div>
        )}

        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
          <div>
            <dt className="text-muted">GM cutoff{college.bestGmCutoff ? ` ’${String(college.bestGmCutoff.year).slice(2)}` : ""}</dt>
            <dd className="font-semibold" title={college.bestGmCutoff ? `${college.bestGmCutoff.branch} closing rank` : undefined}>
              {college.bestGmCutoff ? formatRank(college.bestGmCutoff.closingRank) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Fees / yr</dt>
            <dd className="font-semibold">{college.latestFee ? formatINR(college.latestFee.total) : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Placement</dt>
            <dd className="font-semibold">
              {college.latestPlacement?.percent != null ? formatPercent(college.latestPlacement.percent) : college.latestPlacement?.average != null ? formatLPA(college.latestPlacement.average) : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap gap-2">
          <LinkButton href={href} size="sm" className="flex-1">
            View College
          </LinkButton>
          <CompareToggle slug={college.slug} name={college.shortName ?? college.name} />
          <ShortlistButton collegeId={college.id} initiallySaved={shortlisted} />
        </div>
      </div>
    </article>
  );
}
