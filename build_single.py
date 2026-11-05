#!/usr/bin/env python3
"""build_single.py — inline data/*.js into index.html -> dist/eso_guidelines_single.html

Taipei VGH esophageal cancer guideline app (namespace window.ECG).

Python standard library only.

    python build_single.py                 # build (fails if a referenced data file is missing)
    python build_single.py --allow-missing # build anyway; missing files show as a load error in the page
    python build_single.py --out other.html

The single file still needs internet access for the CDN libraries (React, Babel, Tailwind).
This app has no source-page viewer (META.sourcePages = 0), so the output is fully self-contained apart
from the CDN. (If a `_source_pages/` folder is ever added, its images are NOT inlined: keep that folder
next to the HTML file; the page also looks in ../_source_pages/.)
"""
import argparse
import datetime
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "index.html"
DEFAULT_OUT = ROOT / "dist" / "eso_guidelines_single.html"

SCRIPT_RE = re.compile(r'<script\s+src="(data/[^"?]+?\.js)(?:\?[^"]*)?"\s*>\s*</script>', re.I)
DATA_END = "<!-- DATA:END -->"


def js_for_inline(code: str) -> str:
    """Make JS safe inside an inline <script>: neutralise '</script' and '<!--' sequences."""
    code = re.sub(r"</(script)", r"<\\/\1", code, flags=re.I)
    code = code.replace("<!--", "<\\!--")
    return code


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=str(DEFAULT_OUT), help="output HTML path")
    ap.add_argument("--allow-missing", action="store_true", help="build even if a data file is missing")
    args = ap.parse_args()

    html = SRC.read_text(encoding="utf-8")
    refs = SCRIPT_RE.findall(html)
    if not refs:
        print("error: no <script src=\"data/...\"> tags found in index.html", file=sys.stderr)
        return 1

    missing = [r for r in refs if not (ROOT / r).is_file()]
    if missing and not args.allow_missing:
        print("error: missing data file(s): " + ", ".join(missing), file=sys.stderr)
        print("       run with --allow-missing to build anyway", file=sys.stderr)
        return 1

    inlined = []

    def repl(m: re.Match) -> str:
        rel = m.group(1)
        path = ROOT / rel
        marker = '<script>window.__ECG_CUR = "%s";</script>' % rel
        if not path.is_file():
            return (marker + "\n  <script>(window.__ECG_ERRORS = window.__ECG_ERRORS || []).push("
                    '{ file: "%s", kind: "load", message: "建置時找不到此檔案" });</script>' % rel)
        code = path.read_text(encoding="utf-8-sig")
        inlined.append((rel, len(code.encode("utf-8"))))
        # marker in its own <script> so a syntax error in the data file is still attributed correctly
        return '%s\n  <script data-src="%s">\n/* ===== inlined from %s ===== */\n%s\n</script>' % (marker, rel, rel, js_for_inline(code))

    out_html = SCRIPT_RE.sub(repl, html)

    built = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    has_pages = (ROOT / "_source_pages").is_dir()
    config = (
        "<script>%s window.__ECG_BUILD = { built: '%s', files: %s };</script>"
        % ("window.ECG_CONFIG = Object.assign({ pageBases: ['_source_pages/', '../_source_pages/'] }, window.ECG_CONFIG || {});" if has_pages else "",
           built, "[" + ", ".join('"%s"' % r for r, _ in inlined) + "]")
    )
    if DATA_END in out_html:
        out_html = out_html.replace(DATA_END, DATA_END + "\n  " + config, 1)
    else:
        out_html = out_html.replace('<script type="text/babel">', config + '\n  <script type="text/babel">', 1)

    out = pathlib.Path(args.out)
    if not out.is_absolute():
        out = (pathlib.Path.cwd() / out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(out_html, encoding="utf-8", newline="\n")

    total = sum(n for _, n in inlined)
    print("built %s" % out)
    for rel, n in inlined:
        print("  inlined %-28s %8d bytes" % (rel, n))
    if missing:
        print("  WARNING missing: " + ", ".join(missing))
    print("  data total %d bytes; output %d bytes" % (total, out.stat().st_size))
    if has_pages:
        print("  note: _source_pages/ is not inlined - keep it beside the HTML (or in the parent folder).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
