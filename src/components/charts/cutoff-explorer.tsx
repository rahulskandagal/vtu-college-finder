"use client";

import { useMemo, useState } from "react";
import { CutoffTrendChart } from "./cutoff-trend-chart";
import { computeStats, toChartSeries, type CutoffPoint } from "@/lib/cutoff-engine";
import { formatRank, humanize } from "@/lib/utils";
import { Badge, DemoBadge, Field, Select, Stat } from "@/components/ui";

/** Compact cutoff row shipped to the client (short keys keep the payload small). */
export type CompactCutoff = {
  b: string; // branch slug
  bn: string; // branch short name
  y: number;
  r: number;
  c: string; // category
  g: string; // gender
  st: string; // seat type
  o: number | null;
  cl: number;
  d: boolean; // isDemo
  s: string | null; // source name
  su: string | null; // source url
};

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

export function CutoffExplorer({ rows, title, fixedBranch }: { rows: CompactCutoff[]; title?: string; fixedBranch?: string }) {
  const branches = useMemo(() => uniq(rows.map((r) => r.b)).map((slug) => ({ slug, name: rows.find((r) => r.b === slug)!.bn })).sort((a, b) => a.name.localeCompare(b.name)), [rows]);
  const categories = useMemo(() => uniq(rows.map((r) => r.c)).sort(), [rows]);
  const rounds = useMemo(() => uniq(rows.map((r) => r.r)).sort((a, b) => a - b), [rows]);
  const years = useMemo(() => uniq(rows.map((r) => r.y)).sort((a, b) => b - a), [rows]);

  const [branch, setBranch] = useState(fixedBranch ?? branches[0]?.slug ?? "");
  const [category, setCategory] = useState(categories.includes("GM") ? "GM" : categories[0] ?? "");
  const [round, setRound] = useState<string>("all");
  const [view, setView] = useState<"round" | "category">("round");
  const [tableYear, setTableYear] = useState<string>("all");

  const finalRound = rounds.length ? Math.max(...rounds) : 1;
  const filtered = useMemo(() => {
    const base = rows.filter((r) => r.b === branch && r.g === "ALL" && r.st === "GENERAL");
    if (view === "round") return base.filter((r) => r.c === category && (round === "all" || r.r === Number(round)));
    return base.filter((r) => r.r === (round === "all" ? finalRound : Number(round)));
  }, [rows, branch, category, round, view, finalRound]);

  const points: CutoffPoint[] = filtered.map((r) => ({ year: r.y, round: r.r, category: r.c, openingRank: r.o, closingRank: r.cl }));
  const chart = toChartSeries(points, view);
  const stats = computeStats(view === "round" ? points : points.filter((p) => p.category === category));

  const tableRows = rows
    .filter((r) => r.b === branch && (tableYear === "all" || r.y === Number(tableYear)) && (round === "all" || r.r === Number(round)))
    .sort((a, b) => b.y - a.y || a.r - b.r || a.c.localeCompare(b.c));

  const anyDemo = filtered.some((r) => r.d);
  const sources = uniq(filtered.map((r) => r.s).filter(Boolean) as string[]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        {!fixedBranch && (
          <Field label="Branch">
            <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {branches.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} disabled={view === "category"}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Round">
          <Select value={round} onChange={(e) => setRound(e.target.value)}>
            <option value="all">{view === "round" ? "All rounds" : "Final round"}</option>
            {rounds.map((r) => (
              <option key={r} value={String(r)}>
                Round {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Chart series">
          <Select value={view} onChange={(e) => setView(e.target.value as "round" | "category")}>
            <option value="round">Compare rounds (one category)</option>
            <option value="category">Compare categories (one round)</option>
          </Select>
        </Field>
        <Field label="Table year">
          <Select value={tableYear} onChange={(e) => setTableYear(e.target.value)}>
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">
            {title ?? "Cutoff trend"} · {branches.find((b) => b.slug === branch)?.name} {view === "round" ? `· ${category}` : ""}
          </h3>
          <div className="flex items-center gap-2">
            {anyDemo && <DemoBadge />}
            {sources.length > 0 && (
              <Badge title={sources.join(" | ")}>
                {sources.every((s) => s.startsWith("KEA")) ? `Source: KEA official cut-off documents (${sources.length})` : `${sources.length} source${sources.length === 1 ? "" : "s"}`}
              </Badge>
            )}
          </div>
        </div>
        <CutoffTrendChart rows={chart.rows} keys={chart.keys} />
        <p className="mt-2 text-xs text-muted">Lower rank = more competitive. Closing rank is the last rank allotted a seat in that round.</p>
      </div>

      {stats.latest && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <Stat label="Latest closing" value={formatRank(stats.latest.finalClosing)} hint={`${stats.latest.year} · round ${stats.latest.finalRound}`} />
          <Stat label="Latest opening" value={formatRank(stats.latest.opening)} hint={`${stats.latest.year}`} />
          <Stat label="Most competitive year" value={stats.mostCompetitive ? `${stats.mostCompetitive.year}` : "—"} hint={formatRank(stats.mostCompetitive?.finalClosing)} />
          <Stat label="Least competitive year" value={stats.leastCompetitive ? `${stats.leastCompetitive.year}` : "—"} hint={formatRank(stats.leastCompetitive?.finalClosing)} />
          <Stat label="Year-on-year" value={stats.yoyChange === null ? "—" : `${stats.yoyChange > 0 ? "+" : ""}${formatRank(stats.yoyChange)}`} hint={stats.yoyChangePercent === null ? undefined : `${stats.yoyChangePercent.toFixed(1)}%`} />
          <Stat label="3-year trend" value={humanize(stats.trend)} hint={`avg ${formatRank(stats.recentAverage)}`} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          Cutoff records · {tableRows.length} row{tableRows.length === 1 ? "" : "s"}
        </div>
        <div className="scroll-x max-h-[520px] overflow-y-auto">
          <table className="data-table">
            <thead className="sticky top-0">
              <tr>
                <th>Year</th>
                <th>Round</th>
                <th>Category</th>
                <th>Gender</th>
                <th>Seat type</th>
                <th>Opening</th>
                <th>Closing</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.y}</td>
                  <td>{r.r}</td>
                  <td className="font-medium">{r.c}</td>
                  <td>{r.g}</td>
                  <td>{humanize(r.st)}</td>
                  <td>{formatRank(r.o)}</td>
                  <td className="font-semibold">{formatRank(r.cl)}</td>
                  <td className="text-xs">
                    {r.su ? (
                      <a href={r.su} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {r.s}
                      </a>
                    ) : (
                      r.s ?? "—"
                    )}
                    {r.d && <DemoBadge className="ml-1" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
