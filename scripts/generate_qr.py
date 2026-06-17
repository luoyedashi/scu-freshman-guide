#!/usr/bin/env python3
"""Generate share QR code PNG for the deployed site."""

from __future__ import annotations

import argparse
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_M

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_URL = "https://luoyedashi.github.io/scu-freshman-guide/"
DEFAULT_OUT = ROOT / "assets" / "share-qr.png"


def generate(url: str, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=12,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#8e181c", back_color="white")
    img.save(out)
    print(f"QR -> {out} ({url})")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    generate(args.url, args.out)


if __name__ == "__main__":
    main()
