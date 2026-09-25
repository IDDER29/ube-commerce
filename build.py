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
PAGES = ["index", "eclat-dube", "decouvrir-ube"]


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
    (ROOT / f"{name}.html").write_text(html, encoding="utf-8")
    print(f"built {name}.html")


if __name__ == "__main__":
    for page in PAGES:
        build(page)
