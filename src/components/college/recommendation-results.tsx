import Link from "next/link";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { RecommendationResult, RecommendationItem } from "@/lib/data/recommend";
import type { EligibilityGroup } from "@/lib/cutoff-engine";
import { formatINR, formatPercent, formatRank } from "@/lib/utils";
import { Badge, DemoBadge, EmptyState } from "@/components/ui";
import { CompareToggle, ShortlistButton } from "./actions";

const GROUP_TONE: Record<EligibilityGroup, { border: string; badge: "success" | "primary" | "warning" | "danger" | "neutral" }> = {
  LIKELY: { border: "border-l-green-600", badge: "success" },
  POSSIBLE: { border: "border-l-blue-600", badge: "primary" },
  COMPETITIVE: { border: "border-l-amber-600", badge: "warning" },
  UNLIKELY: { border: "border-l-red-600", badge: "danger" },
  NO_DATA: { border: "border-l-slate-400", badge: "neutral" },
};

function Trend({ trend }: { trend: RecommendationItem["stats"]["trend"] }) {
  if (trend === "TIGHTENING") return <span className="inline-flex items-center gap-1 text-xs text-danger"><TrendingDown className="h-3 w-3" /> Getting tougher</span>;
  if (trend === "LOOSENING") return <span className="inline-flex items-center gap-1 text-xs text-success"><TrendingUp className="h-3 w-3" /> Easing</span>;
  if (trend === "STABLE") return <span className="inline-flex items-center gap-1 text-xs text-muted"><Minus className="h-3 w-3" /> Stable</span>;
  return null;
}

export function RecommendationResults({ result }: { result: RecommendationResult }) {
  if (result.groups.length === 0) {
    return <EmptyState title="No cutoff records match these filters" description="Try removing district, branch or fee filters — or check the cutoff explorer for available data." />;
  }
  return (
    <div className="space-y-10">
      {result.groups.map((g) => (
        <section key={g.group} id={g.group.toLowerCase()}>
          <div className="mb-3 flex flex-wrap items-baseline gap-3">
            <h2 className="text-xl font-semibold">{g.label}</h2>
            <Badge tone={GROUP_TONE[g.group].badge}>{g.items.length} option{g.items.length === 1 ? "" : "s"}</Badge>
            <p className="w-full text-sm text-muted sm:w-auto">{g.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {g.items.map((it) => (
              <ResultCard key={`${it.college.id}-${it.branch.id}`} item={it} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ResultCard({ item }: { item: RecommendationItem }) {
  const s = item.stats;
  const href = `/college/${item.college.slug}`;
  return (
    <article className={`rounded-xl border border-border border-l-4 bg-card p-4 shadow-sm ${GROUP_TONE[item.group].border}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={href} className="font-semibold hover:text-primary">
            {item.college.name}
          </Link>
          <p className="text-xs text-muted">
            {item.college.city}, {item.college.district} · Code {item.college.code}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {item.college.isDemo && <DemoBadge />}
          <Link href={`${href}/${item.branch.slug}`}>
            <Badge tone="primary" className="hover:bg-blue-200">{item.branch.shortName}</Badge>
          </Link>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700">{item.reason}</p>
      {item.usedFallbackCategory && (
        <p className="mt-1 text-xs text-warning">No records for your category — GM cutoffs were used as a reference.</p>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-muted">Latest closing ({s.latest?.year}, R{s.latest?.finalRound})</dt>
          <dd className="text-sm font-semibold">{formatRank(s.latest?.finalClosing)}</dd>
        </div>
        <div>
          <dt className="text-muted">3-yr range</dt>
          <dd className="text-sm font-semibold">
            {formatRank(s.recentMin)} – {formatRank(s.recentMax)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Year-on-year</dt>
          <dd className="text-sm font-semibold">
            {s.yoyChange === null ? "—" : `${s.yoyChange > 0 ? "+" : ""}${formatRank(s.yoyChange)}`}
            <span className="ml-1 font-normal"><Trend trend={s.trend} /></span>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Fee / placement</dt>
          <dd className="text-sm font-semibold">
            {item.latestFee ? formatINR(item.latestFee.total) : "—"}
            <span className="font-normal text-muted"> · </span>
            {item.latestPlacement?.percent != null ? formatPercent(item.latestPlacement.percent) : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-1">
        {s.years.slice(-5).map((y) => (
          <span key={y.year} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700" title={`Final round ${y.finalRound}`}>
            {y.year}: {formatRank(y.finalClosing)}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted">
          Source: {item.sources.map((src) => src.name).join("; ") || "not recorded"}
        </p>
        <div className="flex gap-2">
          <CompareToggle slug={item.college.slug} name={item.college.name} />
          <ShortlistButton collegeId={item.college.id} />
        </div>
      </div>
    </article>
  );
}
