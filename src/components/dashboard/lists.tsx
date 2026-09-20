"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { CollegeCardData } from "@/lib/data/colleges";
import { formatDate, formatINR, formatPercent, formatRank } from "@/lib/utils";
import { Badge, Button, DemoBadge } from "@/components/ui";

type ShortlistItem = CollegeCardData & { note: string | null; branch: { shortName: string; slug: string } | null };

export function ShortlistList({ items }: { items: ShortlistItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  async function remove(id: string) {
    setBusy(id);
    await fetch(`/api/shortlist/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }
  return (
    <ol className="divide-y divide-border">
      {items.map((c, i) => (
        <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
          <span className="w-6 text-sm text-muted">{i + 1}.</span>
          <div className="min-w-0 flex-1">
            <Link href={`/college/${c.slug}`} className="font-medium hover:text-primary">
              {c.name}
            </Link>
            {c.isDemo && <DemoBadge className="ml-1" />}
            {c.branch && <Badge tone="primary" className="ml-1">{c.branch.shortName}</Badge>}
            <p className="text-xs text-muted">
              {c.city} · GM cutoff {c.bestGmCutoff ? formatRank(c.bestGmCutoff.closingRank) : "—"} · fee {c.latestFee ? formatINR(c.latestFee.total) : "—"} · placement {c.latestPlacement?.percent != null ? formatPercent(c.latestPlacement.percent) : "—"}
              {c.note && <> · “{c.note}”</>}
            </p>
          </div>
          <Link href={`/compare?c=${items.map((x) => x.slug).slice(0, 4).join(",")}`} className="text-xs text-primary hover:underline">
            Compare all
          </Link>
          <Button variant="ghost" size="sm" onClick={() => remove(c.id)} disabled={busy === c.id} aria-label="Remove">
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ol>
  );
}

export function ComparisonList({ items }: { items: { id: string; name: string; createdAt: string; colleges: { slug: string; name: string; shortName: string | null }[] }[] }) {
  const router = useRouter();
  async function remove(id: string) {
    await fetch(`/api/comparisons/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <Link href={`/compare?c=${c.colleges.map((x) => x.slug).join(",")}`} className="font-medium hover:text-primary">
              {c.name}
            </Link>
            <p className="text-xs text-muted">
              {c.colleges.map((x) => x.shortName ?? x.name).join(" vs ")} · saved {formatDate(c.createdAt)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => remove(c.id)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
