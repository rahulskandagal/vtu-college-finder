"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type PlacementRow = { year: number; percent: number | null; average: number | null; median: number | null; highest: number | null };

export function PlacementTrendChart({ rows, height = 260 }: { rows: PlacementRow[]; height?: number }) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fontSize: 12 }} width={40} unit="%" />
          <YAxis yAxisId="lpa" orientation="right" tick={{ fontSize: 12 }} width={48} unit=" LPA" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="pct" dataKey="percent" name="Placement %" fill="#bfdbfe" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Line yAxisId="lpa" type="monotone" dataKey="average" name="Average (LPA)" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          <Line yAxisId="lpa" type="monotone" dataKey="median" name="Median (LPA)" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
