"""Compares two directories of screenshots pixel by pixel.

Usage: python scripts/compare-shots.py <beforeDir> <afterDir>

Reports, per pair: identical / differing pixel count, max channel delta and
the share of pixels that changed by more than a small threshold.
"""

import sys
import os
from PIL import Image, ImageChops

THRESHOLD = 8  # per-channel delta below which a pixel counts as unchanged


def compare(a_path, b_path):
    a = Image.open(a_path).convert("RGB")
    b = Image.open(b_path).convert("RGB")

    if a.size != b.size:
        return {
            "status": "SIZE MISMATCH",
            "before": a.size,
            "after": b.size,
        }

    diff = ImageChops.difference(a, b)
    bbox = diff.getbbox()

    # Count pixels whose max channel delta exceeds the threshold.
    gray = diff.convert("L")
    hist = gray.histogram()
    total = a.size[0] * a.size[1]
    changed = total - hist[0]
    changed_over_threshold = sum(hist[THRESHOLD + 1:])

    # Max channel delta.
    max_delta = max(i for i, count in enumerate(hist) if count)

    return {
        "status": "IDENTICAL" if bbox is None else "DIFFERS",
        "size": a.size,
        "changed_px": changed,
        "changed_pct": round(100.0 * changed / total, 3),
        "over_threshold_px": changed_over_threshold,
        "over_threshold_pct": round(100.0 * changed_over_threshold / total, 3),
        "max_delta": max_delta,
        "bbox": bbox,
    }


def main():
    before_dir, after_dir = sys.argv[1], sys.argv[2]
    names = sorted(f for f in os.listdir(before_dir) if f.endswith(".png"))

    print(f"{'shot':<22} {'status':<14} {'changed%':>9} {'>thr%':>8} {'maxD':>6}  bbox")
    print("-" * 78)

    worst = 0.0
    for name in names:
        a = os.path.join(before_dir, name)
        b = os.path.join(after_dir, name)
        if not os.path.exists(b):
            print(f"{name:<22} MISSING IN AFTER")
            continue
        r = compare(a, b)
        if r["status"] == "SIZE MISMATCH":
            print(f"{name:<22} {r['status']}: {r['before']} vs {r['after']}")
            worst = 100.0
            continue
        print(
            f"{name:<22} {r['status']:<14} {r['changed_pct']:>8.3f}% "
            f"{r['over_threshold_pct']:>7.3f}% {r['max_delta']:>6}  {r['bbox']}"
        )
        worst = max(worst, r["over_threshold_pct"])

    print("-" * 78)
    print(f"worst changed-over-threshold share: {worst:.3f}%")


if __name__ == "__main__":
    main()
