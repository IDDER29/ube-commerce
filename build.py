#!/usr/bin/env python3
"""Static site builder for the Ube Halaya store.

    python3 build.py

Reads every page in src/pages/, wraps it in the shared layout and writes the
result to the repository root (index.html, shop.html, ...). No dependencies.

Page files start with a metadata block:

    <!--
    title: La boutique | Ube Halaya
    description: ...
    nav: shop                  # which menu entry is highlighted
    styles: shop               # extra stylesheets from assets/css/pages/
    scripts: shop              # extra scripts from assets/js/pages/
    layout: default            # or "checkout" (minimal header/footer)
    preload_image: assets/img/hero-scene.webp
    -->

Template directives, usable in pages and partials:

    {{name}}               a metadata value
    {{include:name}}       src/partials/name.html
    {{icon:name}}          inline SVG from src/icons/name.svg
    {{card:product-id}}    product card built from src/data/products.json
    {{price:product-id}}   formatted price, e.g. 46,90 €

The catalogue in src/data/products.json is also written to
assets/js/data.js so the cart and product page share the same numbers.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
SITE_NAME = "Ube Halaya"

CATALOGUE = json.loads((SRC / "data" / "products.json").read_text(encoding="utf-8"))
UNIT_PRICE = CATALOGUE["unit_price"]
LATTES_PER_CAN = CATALOGUE["lattes_per_can"]
PRODUCTS = {p["id"]: p for p in CATALOGUE["products"]}

NAV_KEYS = ["home", "shop", "recipes", "about", "faq", "contact"]


# --- helpers ---------------------------------------------------------------

def money(value):
    """17.9 -> '17,90 €' (non-breaking space, French format)."""
    return f"{value:,.2f}".replace(",", " ").replace(".", ",") + " €"


def enrich(p):
    """Derived values shared by the cards, the product page and the JS."""
    p = dict(p)
    p["lattes"] = p["cans"] * LATTES_PER_CAN
    p["compare_at"] = round(p["cans"] * UNIT_PRICE, 2) if p["cans"] > 1 else None
    p["saving_pct"] = (
        round((1 - p["price"] / p["compare_at"]) * 100) if p["compare_at"] else 0
    )
    p["per_latte"] = round(p["price"] / p["lattes"], 2)
    p["url"] = f"product.html?format={p['id']}"
    return p


PRODUCTS = {k: enrich(v) for k, v in PRODUCTS.items()}


def read(path):
    return path.read_text(encoding="utf-8")


def icon(name):
    svg = read(SRC / "icons" / f"{name}.svg").strip()
    return svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ', 1)


def card(pid):
    p = PRODUCTS[pid]
    tpl = read(SRC / "partials" / "product-card.html")
    values = {
        "id": p["id"],
        "name": p["name"],
        "meta": p["meta"],
        "tag": p["tag"],
        "url": p["url"],
        "image": p["card_image"],
        "image_alt": p["card_alt"],
        "hover_image": p["hover_image"],
        "lattes": str(p["lattes"]),
        "price": money(p["price"]),
        "price_raw": f"{p['price']:.2f}",
        "per_latte": money(p["per_latte"]),
        "per_latte_raw": f"{p['per_latte']:.2f}",
        "order": str(p["order"]),
        "compare": f'<s class="price-compare">{money(p["compare_at"])}</s>' if p["compare_at"] else "",
        "badge": f'<span class="badge badge--save">−{p["saving_pct"]}&nbsp;%</span>' if p["saving_pct"] else "",
        "label": f'<span class="badge">{p["label"]}</span>' if p.get("label") else "",
    }
    return render(tpl, values)


DIRECTIVE = re.compile(r"\{\{\s*(?:(include|icon|card|price):)?([\w\-.]+)\s*\}\}")


def render(text, meta, depth=0):
    if depth > 8:
        raise RuntimeError("include depth exceeded")

    def sub(m):
        kind, arg = m.group(1), m.group(2)
        if kind == "include":
            return render(read(SRC / "partials" / f"{arg}.html"), meta, depth + 1)
        if kind == "icon":
            return icon(arg)
        if kind == "card":
            return card(arg)
        if kind == "price":
            return money(PRODUCTS[arg]["price"])
        if arg not in meta:
            raise KeyError(f"unknown template value {{{{{arg}}}}}")
        return meta[arg]

    # Repeat until stable so values can contain directives themselves
    prev = None
    while prev != text:
        prev, text = text, DIRECTIVE.sub(sub, text)
    return text


def parse_page(raw):
    m = re.match(r"\s*<!--(.*?)-->\n?(.*)", raw, re.S)
    if not m:
        raise ValueError("page is missing its metadata block")
    meta = {}
    for line in m.group(1).strip().splitlines():
        line = line.split(" #", 1)[0]
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    return meta, m.group(2)


def tags(kind, names):
    names = [n.strip() for n in names.split(",") if n.strip()]
    if kind == "css":
        return "".join(f'\n  <link rel="stylesheet" href="assets/css/pages/{n}.css">' for n in names)
    return "".join(f'\n  <script src="assets/js/pages/{n}.js" defer></script>' for n in names)


# --- build -----------------------------------------------------------------

def build_page(path):
    name = path.stem
    meta, body = parse_page(read(path))
    for key, value in CATALOGUE.get("store", {}).items():
        meta.setdefault(f"store_{key}", value)
    meta.setdefault("description", "")
    meta.setdefault("nav", "")
    meta["page"] = name
    meta["layout"] = meta.get("layout", "default")
    meta["page_styles"] = tags("css", meta.get("styles", ""))
    meta["page_scripts"] = tags("js", meta.get("scripts", ""))
    preload = meta.get("preload_image")
    meta["preload"] = (
        f'\n  <link rel="preload" href="{preload}" as="image" fetchpriority="high">' if preload else ""
    )
    for key in NAV_KEYS:
        meta[f"nav_{key}"] = ' aria-current="page"' if meta["nav"] == key else ""
    meta["body"] = body.strip("\n")

    layout = read(SRC / "partials" / f"layout-{meta['layout']}.html")
    html = render(layout, meta)
    (ROOT / f"{name}.html").write_text(html, encoding="utf-8")
    return name


def write_data_js():
    public = {
        "unitPrice": UNIT_PRICE,
        "lattesPerCan": LATTES_PER_CAN,
        "freeShipping": CATALOGUE["free_shipping"],
        "shippingCost": CATALOGUE["shipping_cost"],
        "products": {
            pid: {
                "id": pid,
                "name": p["name"],
                "fullName": p["full_name"],
                "meta": p["meta"],
                "cans": p["cans"],
                "price": p["price"],
                "compareAt": p["compare_at"],
                "savingPct": p["saving_pct"],
                "perLatte": p["per_latte"],
                "lattes": p["lattes"],
                "thumb": f"assets/img/{p['card_image']}",
                "photo": f"assets/img/{p['gallery'][0]}",
                "gallery": [f"assets/img/{g}" for g in p["gallery"]],
                "url": p["url"],
            }
            for pid, p in PRODUCTS.items()
        },
    }
    js = (
        "/* Generated by build.py from src/data/products.json — do not edit by hand. */\n"
        f"window.UBE_DATA = {json.dumps(public, ensure_ascii=False, indent=2)};\n"
    )
    (ROOT / "assets" / "js" / "data.js").write_text(js, encoding="utf-8")


if __name__ == "__main__":
    write_data_js()
    built = [build_page(p) for p in sorted((SRC / "pages").glob("*.html"))]
    print("built:", ", ".join(f"{b}.html" for b in built))
