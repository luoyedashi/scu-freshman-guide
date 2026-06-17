#!/usr/bin/env python3
"""Split scores.json into per-province files for lazy loading."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "scores.json"
OUT_DIR = ROOT / "data" / "scores"
INDEX = ROOT / "data" / "scores_index.json"


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    meta = data.get("meta", {})
    records = data.get("records", [])

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    by_prov: dict[str, list] = {}
    for r in records:
        by_prov.setdefault(r["province"], []).append(r)

    provinces = sorted(by_prov.keys(), key=lambda x: (x != "四川", x))
    for prov, rows in by_prov.items():
        path = OUT_DIR / f"{prov}.json"
        path.write_text(
            json.dumps({"province": prov, "records": rows}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    index = {
        "meta": {**meta, "split": True, "provinces": provinces},
        "provinces": provinces,
    }
    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Split {len(records)} records into {len(provinces)} province files")


if __name__ == "__main__":
    main()
