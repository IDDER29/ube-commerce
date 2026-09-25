# Ube Halaya — Éclat d’Ubé

A multi-page e-commerce storefront for Éclat d’Ubé, a ube powder for lattes and desserts.
Plain HTML, CSS and JavaScript with no framework and no runtime dependencies. A small Python script assembles the pages.

## Pages

| Page | File | Purpose |
| --- | --- | --- |
| Accueil | `index.html` | Hero, benefits, formats, ritual, recipes, story, gift offer, FAQ |
| Boutique | `shop.html` | Product grid with sorting, format comparison table |
| Fiche produit | `product.html?format=…` | Gallery, format selector, quantity, add to cart, details, recipes |
| Panier | `cart.html` | Full cart with quantities, savings, free-shipping meter |
| Commande | `checkout.html` | Contact + delivery form with validation, order summary |
| Recettes | `recipes.html` | Filterable recipes, each with ingredients checklist and steps |
| Notre histoire | `about.html` | What ube is, from root to recipe, brand values |
| Aide | `faq.html` | Searchable FAQ by topic |
| Contact | `contact.html` | Validated contact form (opens the visitor’s mail app) |
| Légal | `mentions-legales.html`, `cgv.html`, `confidentialite.html` | Templates with `[placeholders]` to complete |
| 404 | `404.html` | Not-found page |

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
  css/pages/*.css        page-specific styles
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
