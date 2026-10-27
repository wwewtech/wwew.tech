"""Compares the locally built CSS with the CSS served by the deployed site.

Both are normalised before comparison:
  - the Geist module class hash (Next derives it per module instance);
  - the order of rules and whitespace;
  - chunk boundaries (Vercel and a local build split CSS differently).

Usage: python scripts/compare-css-live.py
"""

import re
import sys
import urllib.request
from pathlib import Path

LIVE = "https://wwew.tech"
LOCAL_CSS_DIR = Path(".next/static/chunks")


def get_text(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def normalise(css):
    """Strips the font-module hash and sorts the rules for comparison."""
    css = re.sub(r'geist_[a-z0-9]+', 'geist_HASH', css)
    rules = re.findall(r'[^{}]+\{[^{}]*\}', css)
    # @font-face rules carry hashed asset names; compare them by family only.
    normalised = []
    for r in rules:
        if r.startswith('@font-face'):
            r = re.sub(r'url\([^)]*\)', 'url(HASH)', r)
        normalised.append(re.sub(r'\s+', ' ', r).strip())
    return sorted(set(normalised))


def main():
    local_files = sorted(LOCAL_CSS_DIR.glob("*.css"))
    if not local_files:
        print("No local CSS found - run `npm run build` first.")
        return 1

    html = get_text(LIVE + "/ru")
    live_hrefs = sorted(set(re.findall(r'href="([^"]*\.css)"', html)))
    print(f"live css files : {live_hrefs}")
    print(f"local css files: {[f.name for f in local_files]}")

    live_rules = set()
    for h in live_hrefs:
        live_rules |= set(normalise(get_text(LIVE + h)))

    local_rules = set()
    for f in local_files:
        local_rules |= set(normalise(f.read_text(encoding="utf-8")))

    only_local = local_rules - live_rules
    only_live = live_rules - local_rules

    print()
    print(f"rules: local={len(local_rules)} live={len(live_rules)}")
    print(f"  only in LOCAL: {len(only_local)}")
    print(f"  only in LIVE : {len(only_live)}")

    if not only_local and not only_live:
        print("\nRESULT: CSS is identical (after normalising the font hash and order).")
        return 0

    print("\n--- rules only in LOCAL ---")
    for r in sorted(only_local)[:20]:
        print("  " + r[:160])
    print("\n--- rules only in LIVE ---")
    for r in sorted(only_live)[:20]:
        print("  " + r[:160])
    return 1


if __name__ == "__main__":
    sys.exit(main())
