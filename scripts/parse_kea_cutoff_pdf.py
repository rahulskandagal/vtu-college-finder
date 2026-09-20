"""
Parse a KEA (Karnataka Examinations Authority) engineering cut-off rank PDF into JSON.

Supports both layouts KEA has used:
  * 2019-2024  "ENGINEERING CUTOFF RANK OF CET-20xx - <ROUND> ALLOTMENT ( GENERAL | HK | HYD KAR )"
               college line "12 E012 Name City", rows "CS Computers 1234 -- 5678 ..."
  * 2025+      "UGCET-2025 ... CUT-OFF RANKS FOR Engineering", "Seat Type: ...",
               "College: E012 Name Address", "Course Name 1G 1K ...", rows "COMPUTER SCIENCE ... 1234 -- ..."

Numbers are assigned to category columns by character x-position (the text
layer glues adjacent 6-digit ranks together, so token splitting is unsafe).

Usage:
    python scripts/parse_kea_cutoff_pdf.py <pdf> --year 2025 --round 2 --out data/kea/x.json [--source-url URL]
"""
import argparse
import json
import re
from collections import OrderedDict

import pdfplumber

# KEA category codes: base (1, 2A, 2B, 3A, 3B, GM, SC, ST) + suffix G/K/R/P (general / Kannada medium / rural / ...)
# and an extra H for Hyderabad-Karnataka (371-J) documents; plus NRI / OPN / OTH.
CATEGORY_RE = re.compile(r"^(?:(?:[123][AB]?|GM|SC|ST)(?:G|K|R|P|H|KH|RH|PH)?|NRI|OPN|OTH)$")
NEW_COLLEGE = re.compile(r"^College:\s*\(?(E\d{3})\)?\s*(.*)$")
OLD_COLLEGE = re.compile(r"^\d{1,3}\s+(E\d{3})\s+(.*)$")
VALUE = re.compile(r"^(--|\d+(?:\.\d*)?)$")
FOOTER = re.compile(r"Generated on|Page \d+ of|^\d{2}-[A-Z]{3}-\d{2}\b|^ENGINEERING CUTOFF RANK|^KARNATAKA EXAMINATIONS|^Non-Interactive|^UGCET", re.I)
OLD_COURSE_CODE = re.compile(r"^[A-Z]{2}$")


def seat_type_of(label: str) -> str:
    l = label.lower()
    if "hyd" in l or "kalyana" in l or "371" in l or "( hk )" in l or l.strip() == "hk":
        return "HYDERABAD_KARNATAKA"
    return "GENERAL"


def group_lines(chars, tol=2.5):
    """Group page chars into lines by their `top` coordinate."""
    lines = []
    for ch in sorted(chars, key=lambda c: (round(c["top"]), c["x0"])):
        if ch["text"].isspace():
            continue
        if lines and abs(lines[-1]["top"] - ch["top"]) <= tol:
            lines[-1]["chars"].append(ch)
        else:
            lines.append({"top": ch["top"], "chars": [ch]})
    for ln in lines:
        ln["chars"].sort(key=lambda c: c["x0"])
        ln["text"] = join_chars(ln["chars"])
    return lines


def join_chars(chars):
    text = ""
    prev = None
    for c in chars:
        if prev is not None and c["x0"] - prev["x1"] > 1.2:
            text += " "
        text += c["text"]
        prev = c
    return text.strip()


def words_with_spans(line):
    words = []
    cur = None
    for c in line["chars"]:
        if cur is not None and c["x0"] - cur["x1"] <= 1.2:
            cur["text"] += c["text"]
            cur["x1"] = c["x1"]
        else:
            cur = {"text": c["text"], "x0": c["x0"], "x1": c["x1"]}
            words.append(cur)
    return words


def parse(pdf_path: str):
    colleges = OrderedDict()
    rows = []
    columns = None
    categories = None
    seat = "GENERAL"
    current = None
    pending = None

    with pdfplumber.open(pdf_path) as pdf:
        first = pdf.pages[0].extract_text() or ""
        head = first.split("\n")[0] if first else ""
        m = re.search(r"\(\s*(GENERAL|HK|HYD\s*KAR)\s*\)", head, re.I)
        if m:
            seat = seat_type_of(m.group(1))
        layout = "new" if ("UGCET" in first[:400] or "Seat Type:" in first[:600]) else "old"

        for page in pdf.pages:
            for line in group_lines(page.chars):
                text = line["text"]
                if not text:
                    continue
                if text.lower().startswith("seat type:"):
                    seat = seat_type_of(text)
                    continue
                m = NEW_COLLEGE.match(text) if layout == "new" else OLD_COLLEGE.match(text)
                if m:
                    if m.group(1) != current:
                        pending = None  # keep pending across page breaks that repeat the same college header
                    current = m.group(1)
                    if current not in colleges:
                        colleges[current] = {"code": current, "raw": m.group(2).strip()}
                    continue
                if FOOTER.search(text):
                    continue

                words = words_with_spans(line)
                cat_words = [w for w in words if CATEGORY_RE.match(w["text"])]
                if len(cat_words) >= 10 and len(cat_words) >= len(words) - 2:
                    columns = [(w["text"], (w["x0"] + w["x1"]) / 2, w["x0"], w["x1"]) for w in cat_words]
                    categories = [c[0] for c in columns]
                    if any(c.endswith("H") and c != "OTH" for c in categories):
                        seat = "HYDERABAD_KARNATAKA"
                    continue
                if current is None or columns is None:
                    continue

                # Values are wider than their header labels, so the name/value boundary is
                # placed half a column-spacing left of the first column centre.
                spacing = (columns[-1][1] - columns[0][1]) / max(1, len(columns) - 1)
                boundary = columns[0][1] - spacing * 0.55
                name_chars = [c for c in line["chars"] if (c["x0"] + c["x1"]) / 2 < boundary]
                val_chars = [c for c in line["chars"] if (c["x0"] + c["x1"]) / 2 >= boundary]

                buckets = {cat: "" for cat, *_ in columns}
                for c in val_chars:
                    cx = (c["x0"] + c["x1"]) / 2
                    cat = min(columns, key=lambda col: abs(col[1] - cx))[0]
                    buckets[cat] += c["text"]
                values = {k: v for k, v in buckets.items() if v}
                numeric = sum(1 for v in values.values() if VALUE.match(v))
                name_text = join_chars(name_chars)

                is_fragment_line = all(len(v) <= 2 and v != "--" for v in values.values())
                if len(values) >= 3 and numeric >= len(values) - 1 and not is_fragment_line:
                    course_code = None
                    if layout == "old":
                        parts = name_text.split(" ", 1)
                        if parts and OLD_COURSE_CODE.match(parts[0]):
                            course_code = parts[0]
                            name_text = parts[1] if len(parts) > 1 else ""
                    pending = {"code": current, "courseCode": course_code, "nameParts": [name_text], "values": values, "seat": seat}
                    rows.append(pending)
                elif pending is not None and name_text and (numeric == 0 or is_fragment_line):
                    # wrapped course name; lone 1-2 digit values are tails of tie ranks ("143346." + "5")
                    pending["nameParts"].append(name_text)
                elif pending is None and current in colleges and not values:
                    colleges[current]["raw"] += " " + text

    out_rows = []
    for r in rows:
        name = re.sub(r"\s+", " ", " ".join(p for p in r["nameParts"] if p)).strip()
        key = re.sub(r"[^A-Z0-9]", "", name.upper())
        for cat, v in r["values"].items():
            if not VALUE.match(v) or v == "--":
                continue
            try:
                rank = int(round(float(v.rstrip("."))))
            except ValueError:
                continue
            if rank <= 0 or rank > 400000:
                continue
            out_rows.append({"code": r["code"], "courseCode": r["courseCode"], "course": name, "courseKey": key,
                             "category": cat, "closingRank": rank, "seatType": r["seat"]})

    return {
        "layout": layout,
        "colleges": [{"code": c["code"], "raw": re.sub(r"\s+", " ", c["raw"]).strip()} for c in colleges.values()],
        "categories": categories,
        "rows": out_rows,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--year", type=int, required=True)
    ap.add_argument("--round", type=int, required=True)
    ap.add_argument("--source-url", default="")
    ap.add_argument("--out", required=True)
    ap.add_argument("--list-courses", action="store_true")
    a = ap.parse_args()
    data = parse(a.pdf)
    data["meta"] = {"year": a.year, "round": a.round, "sourceUrl": a.source_url, "pdf": a.pdf}
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=0)
    keys = sorted({(r["courseCode"] or "", r["courseKey"]) for r in data["rows"]})
    seats = sorted({r["seatType"] for r in data["rows"]})
    print(f"{a.pdf}: layout={data['layout']} colleges={len(data['colleges'])} cells={len(data['rows'])} courses={len(keys)} seats={seats}")
    if a.list_courses:
        for k in keys:
            print("  ", k)


if __name__ == "__main__":
    main()
