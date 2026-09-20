"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRank } from "@/lib/utils";

const PALETTE = ["#1d4ed8", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#0369a1", "#4d7c0f", "#a21caf"];

export type ChartRow = Record<string, number | null>;

/**
 * Multi-series line chart of closing (or opening) ranks by year.
 * `rows` — one object per year: { year, [seriesKey]: rank | null }
 */
export function CutoffTrendChart({ rows, keys, height = 280, yLabel = "Closing rank" }: { rows: ChartRow[]; keys: string[]; height?: number; yLabel?: string }) {
  if (!rows.length || !keys.length) {
    return <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">No cutoff data to chart</div>;
  }
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 10, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={64}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }}
            reversed={false}
          />
          <Tooltip
            formatter={(value) => [formatRank(typeof value === "number" ? value : null), ""]}
            labelFormatter={(l) => `Year ${l}`}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {keys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
