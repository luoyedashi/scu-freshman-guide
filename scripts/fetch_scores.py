#!/usr/bin/env python3
"""Semi-automated helper: CSV rows -> scores.json for scu-freshman-guide."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = ROOT / "data" / "scores_import.csv"
DEFAULT_OUT = ROOT / "data" / "scores.json"

CSV_COLUMNS = [
    "year",
    "province",
    "exam_mode",
    "category",
    "batch",
    "control_line",
    "min_score",
    "min_rank",
    "note",
]


def row_to_record(row: dict[str, str]) -> dict:
    def num(key: str) -> int | None:
        val = row.get(key, "").strip()
        if not val:
            return None
        return int(float(val))

    return {
        "year": int(row["year"]),
        "province": row["province"].strip(),
        "exam_mode": row["exam_mode"].strip(),
        "category": row["category"].strip(),
        "batch": row["batch"].strip(),
        "control_line": num("control_line"),
        "min_score": num("min_score"),
        "min_rank": num("min_rank"),
        "note": row.get("note", "").strip(),
    }


def csv_to_json(csv_path: Path, out_path: Path, source: str) -> None:
    records: list[dict] = []
    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get("province"):
                continue
            records.append(row_to_record(row))

    records.sort(key=lambda r: (-r["year"], r["province"], r["category"]))

    provinces = sorted({r["province"] for r in records})
    payload = {
        "meta": {
            "source": source,
            "updated": __import__("datetime").date.today().isoformat(),
            "provinces_covered": provinces,
            "note": "普通类一批/本科批最低录取分，仅供参考",
        },
        "records": records,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} records -> {out_path}")


def write_template(csv_path: Path) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerow(
            {
                "year": "2024",
                "province": "四川",
                "exam_mode": "老高考",
                "category": "理工",
                "batch": "普通类一批",
                "control_line": "539",
                "min_score": "634",
                "min_rank": "",
                "note": "0552组",
            }
        )
    print(f"Template CSV -> {csv_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert score CSV to scores.json")
    parser.add_argument("--template", action="store_true", help="Write import CSV template")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--source", default="https://zs.scu.edu.cn")
    args = parser.parse_args()

    if args.template:
        write_template(args.csv)
        return

    if not args.csv.exists():
        raise SystemExit(f"CSV not found: {args.csv}. Run with --template first.")

    csv_to_json(args.csv, args.out, args.source)


if __name__ == "__main__":
    main()
