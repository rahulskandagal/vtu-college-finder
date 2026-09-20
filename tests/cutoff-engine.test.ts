import { describe, expect, it } from "vitest";
import { classifyRank, computeStats, summarizeByYear, toChartSeries, type CutoffPoint } from "@/lib/cutoff-engine";

const pt = (year: number, round: number, closingRank: number, openingRank: number | null = null, category = "GM"): CutoffPoint => ({ year, round, category, openingRank, closingRank });

const history: CutoffPoint[] = [
  pt(2022, 1, 15000, 1200), pt(2022, 2, 17000, 1500),
  pt(2023, 1, 14000, 1100), pt(2023, 2, 16000, 1300),
  pt(2024, 1, 12000, 900), pt(2024, 2, 13500, 1000),
  pt(2025, 1, 11500, 800), pt(2025, 2, 13000, 950),
  pt(2026, 1, 11000, 700), pt(2026, 2, 12500, 900),
];

describe("summarizeByYear", () => {
  it("uses the highest round as the final closing rank and keeps round 1", () => {
    const years = summarizeByYear(history);
    expect(years.map((y) => y.year)).toEqual([2022, 2023, 2024, 2025, 2026]);
    expect(years[0].finalClosing).toBe(17000);
    expect(years[0].finalRound).toBe(2);
    expect(years[0].round1Closing).toBe(15000);
    expect(years[0].opening).toBe(1200);
  });
});

describe("computeStats", () => {
  it("computes recent window, extremes and trend", () => {
    const s = computeStats(history);
    expect(s.latest?.year).toBe(2026);
    expect(s.recentMin).toBe(12500);
    expect(s.recentMax).toBe(13500);
    expect(s.recentAverage).toBe(13000);
    expect(s.mostCompetitive?.year).toBe(2026);
    expect(s.leastCompetitive?.year).toBe(2022);
    expect(s.yoyChange).toBe(-500);
    expect(s.trend).toBe("STABLE");
  });
  it("detects tightening cutoffs", () => {
    const s = computeStats([pt(2024, 1, 20000), pt(2025, 1, 16000), pt(2026, 1, 12000)]);
    expect(s.trend).toBe("TIGHTENING");
    expect(s.yoyChangePercent).toBeCloseTo(-25);
  });
  it("handles empty input", () => {
    const s = computeStats([]);
    expect(s.latest).toBeNull();
    expect(s.trend).toBe("UNKNOWN");
  });
});

describe("classifyRank", () => {
  it("returns NO_DATA without cutoffs", () => {
    expect(classifyRank(5000, []).group).toBe("NO_DATA");
  });
  it("LIKELY when rank is ≥15% better than every recent closing rank", () => {
    // recentMin = 12500 → threshold 10625
    expect(classifyRank(10000, history).group).toBe("LIKELY");
    expect(classifyRank(10625, history).group).toBe("LIKELY");
  });
  it("POSSIBLE when inside the recent range", () => {
    expect(classifyRank(11000, history).group).toBe("POSSIBLE");
    expect(classifyRank(13500, history).group).toBe("POSSIBLE");
  });
  it("COMPETITIVE up to 35% beyond the worst recent closing rank", () => {
    expect(classifyRank(14000, history).group).toBe("COMPETITIVE");
    expect(classifyRank(18225, history).group).toBe("COMPETITIVE");
  });
  it("UNLIKELY beyond that", () => {
    expect(classifyRank(18226, history).group).toBe("UNLIKELY");
    expect(classifyRank(90000, history).group).toBe("UNLIKELY");
  });
  it("explains the decision with the window", () => {
    const c = classifyRank(11000, history);
    expect(c.reason).toContain("12,500");
    expect(c.reason).toContain("13,500");
  });
});

describe("toChartSeries", () => {
  it("pivots by round", () => {
    const { keys, rows } = toChartSeries(history, "round");
    expect(keys).toEqual(["Round 1", "Round 2"]);
    expect(rows[0]).toEqual({ year: 2022, "Round 1": 15000, "Round 2": 17000 });
  });
  it("pivots by category and fills gaps with null", () => {
    const { keys, rows } = toChartSeries([pt(2025, 1, 100, null, "GM"), pt(2026, 1, 120, null, "GM"), pt(2026, 1, 500, null, "2AG")], "category");
    expect(keys).toEqual(["2AG", "GM"]);
    expect(rows[0]["2AG"]).toBeNull();
    expect(rows[1]["2AG"]).toBe(500);
  });
});
