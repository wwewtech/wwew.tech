"""Records the hero Prism background as loopable videos (dark + light) using
Playwright's built-in video capture, which is far more reliable than raw CDP
screencast for continuous frames.

The page CSS is patched at load so ONLY the shader canvas is visible: nav,
text, CTAs and other sections are hidden with an injected stylesheet, and the
hero is pinned to fill the viewport. The theme is set via localStorage before
load so each pass records the right palette.

Usage:
    python scripts/record_hero.py [url] [out_prefix] [seconds]
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4010/ru"
prefix = sys.argv[2] if len(sys.argv) > 2 else "public/hero-bg"
seconds = int(sys.argv[3]) if len(sys.argv) > 3 else 8

HIDE_CSS = """
*, *::before, *::after { animation: none !important; transition: none !important; }
nav, footer { display: none !important; }
#home section > div.relative.z-10 { display: none !important; }
#home section { min-height: 0 !important; height: 100vh !important; }
"""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--headless=new"])
    for theme, name in [("dark", "dark"), ("light", "light")]:
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_size={"width": 1280, "height": 720},
            record_video_dir=str(Path(prefix).parent),
        )
        context.add_init_script(
            f"try {{ localStorage.setItem('theme', {theme!r}); }} catch (e) {{}}"
        )
        page = context.new_page()
        page.goto(url, wait_until="networkidle")
        page.add_style_tag(content=HIDE_CSS)
        # Give Prism its idle+fallback window to init and settle.
        page.wait_for_timeout(2500)
        page.wait_for_timeout(seconds * 1000)
        video = page.video
        path = video.path()
        page.close()
        context.close()
        out = f"{prefix}-{name}.webm"
        target = Path(out)
        target.parent.mkdir(parents=True, exist_ok=True)
        Path(path).replace(target)
        print(f"saved {out} ({target.stat().st_size // 1024} KB)")
    browser.close()
