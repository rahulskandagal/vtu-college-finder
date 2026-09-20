import { describe, expect, it } from "vitest";
import { normalizeHeader, parseCsv, validateRows } from "@/lib/import/cutoffs";

const colleges = new Set(["E005", "E101"]);
const branches = new Set(["CS", "CSE", "COMPUTER-SCIENCE-ENGINEERING", "EC", "ECE"]);

describe("normalizeHeader", () => {
  it("maps aliases and casing to canonical names", () => {
    expect(normalizeHeader("College Code")).toBe("college_code");
    expect(normalizeHeader("Closing Rank")).toBe("closing_rank");
    expect(normalizeHeader("cutoff")).toBe("closing_rank");
    expect(normalizeHeader("Seat-Type")).toBe("seat_type");
    expect(normalizeHeader("Year")).toBe("year");
  });
});

describe("parseCsv + validateRows", () => {
  const csv = `College Code,Branch,Year,Round,Category,Gender,Opening Rank,Closing Rank
E005,CS,2025,1,gm,,1200,5400
E005,CS,2025,2,GM,ALL,1350,6100
E005,CS,2025,1,GM,,1200,5400
E999,CS,2025,1,GM,,,5400
E005,ZZ,2025,1,GM,,,5400
E005,EC,1999,1,GM,,,5400
E005,EC,2025,x,GM,,,5400
E005,EC,2025,1,,,,5400
E005,EC,2025,1,GM,,9000,5400
E005,EC,2025,1,GM,,,abc
E101,ECE,2024,,2AG,F,"1,200","15,800"`;

  it("accepts valid rows, normalises values and reports every problem with a row number", () => {
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(11);
    const res = validateRows(rows, colleges, branches);
    expect(res.total).toBe(11);
    expect(res.valid).toHaveLength(3);
    expect(res.duplicatesInFile).toBe(1);

    const byRow = Object.fromEntries(res.errors.map((e) => [e.rowNumber, e]));
    expect(byRow[4].message).toMatch(/Duplicate/);
    expect(byRow[5].field).toBe("college_code");
    expect(byRow[6].field).toBe("branch");
    expect(byRow[7].field).toBe("year");
    expect(byRow[8].field).toBe("round");
    expect(byRow[9].field).toBe("category");
    expect(byRow[10].field).toBe("opening_rank");
    expect(byRow[11].field).toBe("closing_rank");

    const last = res.valid.find((v) => v.rowNumber === 12)!;
    expect(last.round).toBe(1); // default
    expect(last.gender).toBe("FEMALE");
    expect(last.openingRank).toBe(1200); // thousands separators stripped
    expect(last.closingRank).toBe(15800);
    expect(last.category).toBe("2AG");
    expect(res.valid[0].category).toBe("GM"); // upper-cased
  });
});
