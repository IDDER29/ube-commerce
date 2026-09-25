# Ube Halaya — Éclat d’Ubé

Static HTML/CSS/JS storefront built from the UI flow mockups. No framework, no dependencies.

| Page | File |
| --- | --- |
| Accueil (hero, formats, recettes, histoire, FAQ) | `index.html` |
| Fiche produit Éclat d’Ubé (galerie, formats, panier, recette) | `eclat-dube.html` |
| Découvrir l’ube | `decouvrir-ube.html` |

## Editing

The root `*.html` files are **generated**. Edit the sources, then rebuild:

```
src/partials/head.html     <head>, announcement bar, header + navigation
src/partials/footer.html   footer, newsletter, cart drawer, script tag
src/pages/*.html           page content (title/description at the top)

python3 build.py           → writes index.html, eclat-dube.html, decouvrir-ube.html
```

- `assets/css/styles.css` — design tokens and all styles, organised by section (see the table of contents at the top).
- `assets/js/main.js` — cart drawer (saved in `localStorage`, synced across tabs), free-shipping progress from 45 €, format/quantity picker, gallery and zoom, sticky header, mobile menu, sticky add-to-cart bar on phones, recipe panel, newsletter.
- `assets/fonts/` — self-hosted Fraunces, Figtree and Sacramento (no Google Fonts request).
- `assets/img/` — WebP photos cropped from the mockups, `logo.svg` / `favicon.svg`, `wall.webp` texture tile. Replace the photos with full-resolution shots (same file names) for the sharpest result.

## Flow

Home → “Choisir ce format” opens the product page with that format preselected (`eclat-dube.html?format=coffret-3`) → add to cart → cart drawer. Recipe links open the full “Latte signature” recipe (`eclat-dube.html#latte-signature`).

## Run

Open `index.html` in a browser, or serve the folder: `python3 -m http.server`.

Screenshots of every page (desktop and mobile) are in `docs/screenshots/`.
