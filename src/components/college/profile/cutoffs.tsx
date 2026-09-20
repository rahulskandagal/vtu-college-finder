import type { CollegeProfile } from "@/lib/data/colleges";
import type { CutoffRow } from "@/lib/data/cutoffs";
import { CutoffExplorer, type CompactCutoff } from "@/components/charts/cutoff-explorer";
import { EmptyState } from "@/components/ui";

export function toCompact(rows: CutoffRow[]): CompactCutoff[] {
  return rows.map((r) => ({
    b: r.branch.slug,
    bn: r.branch.shortName,
    y: r.year,
    r: r.round,
    c: r.category,
    g: r.gender,
    st: r.seatType,
    o: r.openingRank,
    cl: r.closingRank,
    d: r.isDemo,
    s: r.source?.name ?? null,
    su: r.source?.url ?? null,
  }));
}

export function CutoffsTab({ college, cutoffs }: { college: CollegeProfile; cutoffs: CutoffRow[] }) {
  if (cutoffs.length === 0) return <EmptyState title="No KCET cutoff records for this college yet" description="Cutoffs can be added by an administrator via CSV import." />;
  return <CutoffExplorer rows={toCompact(cutoffs)} title={`${college.shortName ?? college.name} — KCET cutoff history`} />;
}
