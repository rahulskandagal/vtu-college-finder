/**
 * Cutoff engine — pure functions that turn historical KCET cutoff rows into
 * eligibility groups and trend statistics. No database access here so the
 * logic is easy to unit-test.
 *
 * IMPORTANT: outputs are *historical reference* groupings, never admission
 * predictions. UI must always show the disclaimer alongside these results.
 */

export type CutoffPoint = {
  year: number;
  round: number;
  category: string;
  openingRank: number | null;
  closingRank: number;
};

export type EligibilityGroup = "LIKELY" | "POSSIBLE" | "COMPETITIVE" | "UNLIKELY" | "NO_DATA";

export const GROUP_META: Record<EligibilityGroup, { label: string; description: string; order: number }> = {
  LIKELY: {
    label: "Likely available",
    description: "Historical closing ranks have been comfortably higher (worse) than your rank in recent years.",
    order: 0,
  },
  POSSIBLE: {
    label: "Possible",
    description: "Your rank falls inside the range of historical closing ranks for recent years.",
    order: 1,
  },
  COMPETITIVE: {
    label: "Competitive",
    description: "Your rank is somewhat beyond recent closing ranks; admission has depended on year, round and seat type.",
    order: 2,
  },
  UNLIKELY: {
    label: "Historically unlikely",
    description: "Historical closing ranks have been significantly more competitive than your rank.",
    order: 3,
  },
  NO_DATA: {
    label: "No cutoff data",
    description: "No historical cutoff records are available for this category.",
    order: 4,
  },
};

/** Thresholds are multiples of the historical closing rank window. */
export const THRESHOLDS = {
  likelyMargin: 0.85, // rank must be at least 15% better than the *best* recent closing rank
  competitiveMargin: 1.35, // up to 35% beyond the *worst* recent closing rank
  recentYears: 3,
};

export type YearSummary = {
  year: number;
  /** Closing rank of the final (highest) round recorded for the year. */
  finalClosing: number;
  finalRound: number;
  /** Closing rank of round 1 if recorded. */
  round1Closing: number | null;
  opening: number | null;
  rounds: { round: number; openingRank: number | null; closingRank: number }[];
};

export type CutoffStats = {
  years: YearSummary[];
  latest: YearSummary | null;
  mostCompetitive: YearSummary | null; // lowest closing rank
  leastCompetitive: YearSummary | null; // highest closing rank
  recentMin: number | null;
  recentMax: number | null;
  recentAverage: number | null;
  yoyChange: number | null; // latest.finalClosing - previous.finalClosing
  yoyChangePercent: number | null;
  trend: "TIGHTENING" | "LOOSENING" | "STABLE" | "UNKNOWN";
};

/** Group raw cutoff rows into one summary per year (sorted ascending by year). */
export function summarizeByYear(points: CutoffPoint[]): YearSummary[] {
  const byYear = new Map<number, CutoffPoint[]>();
  for (const p of points) {
    if (!byYear.has(p.year)) byYear.set(p.year, []);
    byYear.get(p.year)!.push(p);
  }
  const out: YearSummary[] = [];
  for (const [year, rows] of byYear) {
    const sorted = [...rows].sort((a, b) => a.round - b.round);
    const final = sorted[sorted.length - 1];
    const r1 = sorted.find((r) => r.round === 1);
    out.push({
      year,
      finalClosing: final.closingRank,
      finalRound: final.round,
      round1Closing: r1?.closingRank ?? null,
      opening: r1?.openingRank ?? final.openingRank ?? null,
      rounds: sorted.map((r) => ({ round: r.round, openingRank: r.openingRank, closingRank: r.closingRank })),
    });
  }
  return out.sort((a, b) => a.year - b.year);
}

export function computeStats(points: CutoffPoint[]): CutoffStats {
  const years = summarizeByYear(points);
  if (years.length === 0) {
    return {
      years,
      latest: null,
      mostCompetitive: null,
      leastCompetitive: null,
      recentMin: null,
      recentMax: null,
      recentAverage: null,
      yoyChange: null,
      yoyChangePercent: null,
      trend: "UNKNOWN",
    };
  }
  const latest = years[years.length - 1];
  const previous = years.length > 1 ? years[years.length - 2] : null;
  const recent = years.slice(-THRESHOLDS.recentYears);
  const recentClosings = recent.map((y) => y.finalClosing);
  const recentMin = Math.min(...recentClosings);
  const recentMax = Math.max(...recentClosings);
  const recentAverage = Math.round(recentClosings.reduce((a, b) => a + b, 0) / recentClosings.length);
  const mostCompetitive = years.reduce((a, b) => (b.finalClosing < a.finalClosing ? b : a));
  const leastCompetitive = years.reduce((a, b) => (b.finalClosing > a.finalClosing ? b : a));
  const yoyChange = previous ? latest.finalClosing - previous.finalClosing : null;
  const yoyChangePercent = previous && previous.finalClosing > 0 ? (yoyChange! / previous.finalClosing) * 100 : null;

  let trend: CutoffStats["trend"] = "UNKNOWN";
  if (recent.length >= 2) {
    const first = recent[0].finalClosing;
    const last = recent[recent.length - 1].finalClosing;
    const delta = (last - first) / first;
    trend = delta < -0.08 ? "TIGHTENING" : delta > 0.08 ? "LOOSENING" : "STABLE";
  }

  return {
    years,
    latest,
    mostCompetitive,
    leastCompetitive,
    recentMin,
    recentMax,
    recentAverage,
    yoyChange,
    yoyChangePercent,
    trend,
  };
}

export type Classification = {
  group: EligibilityGroup;
  reason: string;
  stats: CutoffStats;
};

/**
 * Place a student rank into an eligibility group using the recent
 * (default 3-year) window of final-round closing ranks.
 *
 * A *lower* KCET rank is better. A closing rank of 15,000 means the last seat
 * went to rank 15,000, so a student with rank 12,000 was inside the range.
 */
export function classifyRank(rank: number, points: CutoffPoint[]): Classification {
  const stats = computeStats(points);
  if (!stats.latest || stats.recentMin === null || stats.recentMax === null) {
    return { group: "NO_DATA", reason: "No historical cutoff records for this category.", stats };
  }
  const { recentMin, recentMax } = stats;
  const fmt = (n: number) => n.toLocaleString("en-IN");
  const window = `${fmt(recentMin)} – ${fmt(recentMax)}`;

  if (rank <= recentMin * THRESHOLDS.likelyMargin) {
    return {
      group: "LIKELY",
      reason: `Your rank ${fmt(rank)} is at least 15% better than every recent closing rank (${window}).`,
      stats,
    };
  }
  if (rank <= recentMax) {
    return {
      group: "POSSIBLE",
      reason: `Your rank ${fmt(rank)} is within the recent closing-rank range (${window}).`,
      stats,
    };
  }
  if (rank <= recentMax * THRESHOLDS.competitiveMargin) {
    return {
      group: "COMPETITIVE",
      reason: `Your rank ${fmt(rank)} is up to 35% beyond the recent closing-rank range (${window}); outcome depended on round and seat type.`,
      stats,
    };
  }
  return {
    group: "UNLIKELY",
    reason: `Recent closing ranks (${window}) have been significantly more competitive than your rank ${fmt(rank)}.`,
    stats,
  };
}

/** Rows for a multi-year line chart: one object per year with a key per round/category. */
export function toChartSeries(points: CutoffPoint[], keyBy: "round" | "category" = "round") {
  const years = Array.from(new Set(points.map((p) => p.year))).sort((a, b) => a - b);
  const keys = Array.from(new Set(points.map((p) => (keyBy === "round" ? `Round ${p.round}` : p.category)))).sort();
  const rows = years.map((year) => {
    const row: Record<string, number | null> = { year };
    for (const k of keys) row[k] = null;
    for (const p of points.filter((p) => p.year === year)) {
      row[keyBy === "round" ? `Round ${p.round}` : p.category] = p.closingRank;
    }
    return row;
  });
  return { keys, rows };
}
