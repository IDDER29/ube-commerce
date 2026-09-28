# Ube Halaya — Éclat d’Ubé

Static HTML/CSS/JS storefront built from the UI flow mockups. No framework, no dependencies.

| Page | File |
| --- | --- |
| Accueil (mockups 1–3) | `index.html` |
| Fiche produit Éclat d’Ubé (mockup 4) | `eclat-dube.html` |
| Découvrir l’ube (mockup 5) | `decouvrir-ube.html` |
| Recettes (latte signature, cake à l’ube, cookiez à l’ube) | `recettes.html` |
| Notre histoire | `notre-histoire.html` |
| Livraison et retours | `livraison.html` |
| Contact | `contact.html` |
| Panier | `panier.html` |
| Commande | `commande.html` |
| Mentions légales, CGV, Confidentialité | `mentions-legales.html`, `cgv.html`, `confidentialite.html` |
| Page introuvable | `404.html` |

The pages after Découvrir l’ube are not in the mockups; they reuse the mockups' components
(plaster-wall hero, Sacramento line, Fraunces titles, pink cards, magenta buttons)
so every link in the design leads to a real page.

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

Legal pages are templates: complete every `[placeholder]` before going live.

## Design system

All sizes come from tokens at the top of `assets/css/styles.css`:

- **Type scale:** `--fs-sm` 14 · `--fs-base` 16 · `--fs-md` 18 · `--fs-lg` 22 (card titles) ·
  `--fs-xl` 28→40 (section titles) · `--fs-h1` 42→76 (page titles) · `--fs-display` 51→104 (home hero),
  plus `--fs-script` / `--fs-script-lg` for the handwritten lines. Nothing below 14px except badges.
- **Spacing:** `--space-section` 56→96 above and below every section, `--space-title` between a
  section title and its content, `--space-band` inside banners. `--measure` caps lines at 65 characters.
- The "Rhythm & hierarchy" block at the end of the stylesheet applies these to every shared element.

`build.py` also writes `assets/css/styles.min.css`, which the pages load. Edit `styles.css`, then rebuild.
Fonts are subset to the characters used on the site; if you add text in another alphabet, re-subset them.

## Avant la mise en ligne

Le site est complet côté pages, parcours d’achat et responsive. Le paiement sera géré par **Shopify**.
Les informations encore inconnues sont signalées par un encadré jaune `[entre crochets]`
(classe `.placeholder`) : chercher `class="placeholder"` dans `src/` pour toutes les retrouver.

- `[adresse e-mail de contact]` : page contact, pages légales, et l’attribut `data-email` du formulaire de contact.
- Mentions légales, CGV, confidentialité : raison sociale, SIREN, hébergeur, médiateur, etc.
- Photos : visuels d’intention, à remplacer par les vraies photos (mêmes noms de fichiers dans `assets/img/`).
- Recettes « Glace à l’ube » et « Latte chaud à l’ube » : à tester avant publication.
