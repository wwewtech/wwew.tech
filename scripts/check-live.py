"""Checks the deployed site for the features this change introduced.

Usage: python scripts/check-live.py [baseUrl]
"""

import sys
import urllib.request
import urllib.error
import re

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://wwew.tech"


def fetch(path, headers=None, method="GET"):
    req = urllib.request.Request(BASE + path, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.headers, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.headers, e.read().decode("utf-8", "replace")


def head_status(path, headers=None):
    """Follows redirects and reports the final status + location."""
    req = urllib.request.Request(BASE + path, headers=headers or {}, method="GET")

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None

    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(req, timeout=25) as r:
            return r.status, r.headers.get("Location")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location")


print("=" * 70)
print("LIVE SITE CHECK:", BASE)
print("=" * 70)

print("\n-- routes --")
for path in ["/", "/ru", "/en", "/ru/nope", "/en/nope", "/robots.txt",
             "/sitemap.xml", "/manifest.json", "/llms.txt", "/opengraph-image"]:
    status, _, _ = fetch(path)
    print(f"  {path:<22} {status}")

print("\n-- locale negotiation (Accept-Language) --")
cases = [
    ("ru-RU,ru;q=0.9,en;q=0.8", "ru"),
    ("en-US,en;q=0.9", "en"),
    ("de-DE,de;q=0.9", "ru"),
    ("ben-BD,bn;q=0.9", "ru"),
    ("fr-FR,fr;q=0.9,en;q=0.5", "en"),
]
for al, expected in cases:
    status, loc = head_status("/", {"Accept-Language": al})
    got = (loc or "").rstrip("/").split("/")[-1]
    ok = "OK " if got == expected else "FAIL"
    print(f"  [{ok}] {al:<28} -> {got} (expected {expected})")

print("\n-- cookie override --")
status, loc = head_status("/", {"Accept-Language": "ru-RU", "Cookie": "locale=en"})
got = (loc or "").rstrip("/").split("/")[-1]
print(f"  [{'OK ' if got == 'en' else 'FAIL'}] Accept-Language=ru + cookie=locale=en -> {got} (expected en)")

print("\n-- cookie is set --")
_, headers, _ = fetch("/", {"Accept-Language": "en-US"})
sc = headers.get("Set-Cookie") or ""
print(f"  [{'OK ' if 'locale=en' in sc else 'FAIL'}] Set-Cookie: {sc}")

print("\n-- branded 404 --")
for loc, lang, text, not_text in [
    ("/ru/nope", "ru", "Страница не найдена", "Page not found"),
    ("/en/nope", "en", "Page not found", "Страница не найдена"),
]:
    status, _, body = fetch(loc)
    html_lang = re.search(r'<html lang="([^"]*)"', body)
    html_lang = html_lang.group(1) if html_lang else "?"
    checks = {
        "status 404": status == 404,
        f"lang={lang}": html_lang == lang,
        "correct copy": text in body,
        "no other language": not_text not in body,
        "not framework default": "could not be found" not in body,
        "has stylesheet": 'rel="stylesheet"' in body,
        "noindex": 'name="robots" content="noindex' in body,
    }
    print(f"  {loc}: " + "  ".join(
        f"{k}={'OK' if v else 'FAIL'}" for k, v in checks.items()))

print("\n-- existing pages intact --")
for loc, hero in [("/ru", "Разработка"), ("/en", "Build")]:
    status, _, body = fetch(loc)
    checks = {
        "200": status == 200,
        "hero": hero in body,
        "h1": "<h1" in body,
        "canonical": f'rel="canonical" href="https://wwew.tech{loc}"' in body,
        "stylesheet": 'rel="stylesheet"' in body,
        "json-ld": "application/ld+json" in body,
        "og:image": 'property="og:image"' in body,
        "navbar": "wwew.tech" in body,
    }
    print(f"  {loc}: " + "  ".join(
        f"{k}={'OK' if v else 'FAIL'}" for k, v in checks.items()))

print("\n" + "=" * 70)
