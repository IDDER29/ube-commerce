#!/usr/bin/env python3
"""Assemble the static pages from src/partials + src/pages.

Each page in src/pages starts with a metadata block:

    <!--
    title: ...
    description: ...
    preload_image: assets/img/...
    -->

Run `python3 build.py` after editing anything in src/; the generated
*.html files at the repository root are what the browser serves.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
PAGES = [
    "index", "eclat-dube", "decouvrir-ube",
    "recettes", "notre-histoire", "livraison", "contact", "panier", "commande",
    "mentions-legales", "cgv", "confidentialite", "404",
]


NBSP_BEFORE = re.compile(r"[ \t]+([?!:;»])")
SKIP_BLOCK = re.compile(r"(<script\b.*?</script>|<style\b.*?</style>)", re.S | re.I)


def french_spacing(html):
    """Non-breaking space before ? ! : ; » in visible text only, so French
    punctuation never wraps onto its own line."""
    def fix_text(chunk):
        parts = re.split(r"(<[^>]+>)", chunk)
        return "".join(p if p.startswith("<") else NBSP_BEFORE.sub("\u00a0\\1", p) for p in parts)
    pieces = SKIP_BLOCK.split(html)
    return "".join(p if SKIP_BLOCK.fullmatch(p) else fix_text(p) for p in pieces)


def build(name):
    raw = (SRC / "pages" / f"{name}.html").read_text(encoding="utf-8")
    meta_block, body = re.match(r"\s*<!--(.*?)-->\n?(.*)", raw, re.S).groups()
    meta = dict(
        line.split(":", 1) for line in meta_block.strip().splitlines() if ":" in line
    )
    meta = {k.strip(): v.strip() for k, v in meta.items()}
    meta.setdefault("head_extra", "")
    meta["page"] = name
    for page in PAGES:
        meta[f"nav_{page}"] = ' aria-current="page"' if page == name else ""

    head = (SRC / "partials" / "head.html").read_text(encoding="utf-8")
    foot = (SRC / "partials" / "footer.html").read_text(encoding="utf-8")
    html = head + body + foot
    html = re.sub(r"\{\{([\w-]+)\}\}", lambda m: meta[m.group(1)], html)
    html = french_spacing(html)
    (ROOT / f"{name}.html").write_text(html, encoding="utf-8")
    print(f"built {name}.html")


if __name__ == "__main__":
    for page in PAGES:
        build(page)
