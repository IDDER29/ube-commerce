# Ube Halaya — Éclat d’Ubé

A multi-page e-commerce storefront for Éclat d’Ubé, a ube powder for lattes and desserts.
Plain HTML, CSS and JavaScript with no framework and no runtime dependencies. A small Python script assembles the pages.

## Pages

The three pages from the UI flow mockups follow their layout, content and wording:

| Mockup | Page | File |
| --- | --- | --- |
| 1 | Accueil | `index.html` |
| 2 | Fiche produit (Boutique) | `product.html?format=canette-1 / coffret-3 / coffret-6` |
| 3 | Découvrir l’ube | `decouvrir-ube.html` |

Supporting pages, styled to match, so every link in the mockups leads somewhere:

| Page | File |
| --- | --- |
| Recettes (latte signature, cake à l’ube, cookiez à l’ube) | `recipes.html` |
| Notre histoire | `about.html` |
| Aide / Livraison et retours | `faq.html` |
| Contact | `contact.html` |
| Panier, Commande | `cart.html`, `checkout.html` |
| Mentions légales, CGV, Confidentialité | `mentions-legales.html`, `cgv.html`, `confidentialite.html` |
| Page introuvable | `404.html` |

## Project structure

```
src/
  data/products.json     catalogue, prices, shipping rules, store e-mail  ← edit prices here
  partials/              layout, header, footer, cart drawer, product card, recipe cards…
  pages/                 one file per page (metadata block + content)
  icons/                 SVG icons, inlined at build time
build.py                 assembles src/ into the *.html files at the root
assets/
  css/base.css           design tokens, typography, buttons, forms
  css/layout.css         announcement bar, header/menu, footer, newsletter, drawer
  css/components.css     product card, steps, recipe cards, accordion, promo…
  css/pages/*.css        page-specific styles (home, product, discover, content, cart)
  js/data.js             generated from products.json (do not edit)
  js/cart.js             cart store (localStorage, synced across tabs)
  js/ui.js               shared UI: menu, drawer, add-to-cart, toast, newsletter
  js/pages/*.js          page-specific behaviour
  fonts/  img/
```

The root `*.html` files and `assets/js/data.js` are **generated**. Edit `src/`, then run:

```
python3 build.py
```

Template directives available in pages and partials: `{{include:name}}`, `{{icon:name}}`,
`{{card:product-id}}`, `{{price:product-id}}`, `{{store_email}}`.

## Widths & breakpoints

- Page content never exceeds `--container` (1240px); FAQ, specs and forms use
  `--container-narrow` (880px); long text is capped at `--measure` (62ch).
  All three are tokens at the top of `assets/css/base.css`.
- Tested at 320, 390, 768, 1024, 1440, 1920 and 2560px with no horizontal scroll.
- Main breakpoints: 1100px (laptop), 960px (mobile menu), 860/820px (single
  column), 560px (phone). The product format picker uses a container query, so
  it switches to a list whenever the buy box itself is narrow.

## Run locally

```
python3 -m http.server
```

Then open http://localhost:8000.

## Before going live

- **Payment**: `checkout.html` validates the order details but does not charge. Connect a
  payment provider (e.g. Stripe Checkout) in `assets/js/pages/checkout.js`.
- **Newsletter & contact**: the newsletter form only validates; the contact form opens the
  visitor’s e-mail app. Connect a form/e-mail service to collect them server-side.
- **Store e-mail**: set the real address in `src/data/products.json` (`store.email`).
- **Legal pages**: complete every `[placeholder]` in the three legal pages.
- **Product facts**: check composition, allergens, recipes and return policy wording.
- **Photos**: images in `assets/img/` are low-resolution crops from the design mockups;
  replace them with original photography (same file names) for a sharper result.

Screenshots of every page (desktop and mobile) are in `docs/screenshots/`.
