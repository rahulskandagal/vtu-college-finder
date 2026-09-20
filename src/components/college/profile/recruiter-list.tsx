"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type R = { name: string; sector: string; sectorKey: string; year: number | null };

export function RecruiterList({ recruiters }: { recruiters: R[] }) {
  const sectors = useMemo(() => Array.from(new Map(recruiters.map((r) => [r.sectorKey, r.sector])).entries()).sort((a, b) => a[1].localeCompare(b[1])), [recruiters]);
  const [sector, setSector] = useState<string>("all");
  const list = recruiters.filter((r) => sector === "all" || r.sectorKey === sector).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {[["all", "All sectors"], ...sectors].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setSector(k)} className={cn("rounded-full border px-3 py-1 text-xs", sector === k ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-slate-50")}>
            {label}
          </button>
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <li key={r.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span className="font-medium">{r.name}</span>
            <span className="text-xs text-muted">
              {r.sector}
              {r.year ? ` · ${r.year}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
