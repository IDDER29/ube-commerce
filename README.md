# Ube Halaya — Éclat d’Ubé

Static HTML/CSS/JS storefront built from the UI flow mockups.

| Page | File |
| --- | --- |
| Accueil (hero, formats, recettes, histoire, FAQ) | `index.html` |
| Fiche produit Éclat d’Ubé (galerie, formats, panier) | `eclat-dube.html` |
| Découvrir l’ube | `decouvrir-ube.html` |

- `assets/css/styles.css` — design tokens and all styles (responsive down to 390px).
- `assets/js/main.js` — cart drawer (saved in `localStorage`), free-shipping progress from 45 €, format/quantity picker, gallery, mobile menu, newsletter.
- `assets/img/` — photos cropped from the mockups; swap them for full-resolution shots when available.

The flow goes: home → "Choisir ce format" opens the product page with that format preselected (`eclat-dube.html?format=coffret-3`) → add to cart → cart drawer.

Open `index.html` in a browser, or serve the folder: `python3 -m http.server`.
