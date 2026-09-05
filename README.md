# Aurelia

An editorial, off-white Shopify theme for a jewellery house. Built on Shopify's
Skeleton theme, which is the only codebase the Theme Store accepts for a new
theme.

Rules do the work that cards and shadows do elsewhere. There is no border radius
anywhere except the 16px swatch dot, and exactly one shadow in the whole theme —
under a sheet floating above the page.

## Getting started

```bash
shopify theme dev --store your-store.myshopify.com
shopify theme check
```

## Architecture

```
assets/      critical.css, six deferred scripts, no libraries
config/      settings_schema.json, settings_data.json (holds the three presets)
layout/      theme.liquid, password.liquid
listings/    per-preset template variants for the Theme Store submission
locales/     en.default.json (storefront), en.default.schema.json (editor)
scripts/     seed.mjs, to fill a development store with test data
sections/    41 sections, plus three section groups
snippets/    shared components, every one with a {% doc %} header
templates/   JSON templates, plus gift_card.liquid
```

### Design tokens

`snippets/css-variables.liquid` emits every token as a CSS custom property and is
the only place that reads a theme setting for styling. Sections consume tokens,
never settings.

Sizes are `rem` off a `type_base_size` setting, and `html` is sized in `%` so a
customer's own browser font size is respected rather than overridden. Nothing is
hard-coded in px except a handful of fixed image heights that are merchant
settings in their own right.

### Colors

Two color schemes, `ground` and `ink`, defined as a `color_scheme_group`. Each
carries a background, body text, heading, accent and button pair; the secondary
text, the quiet tint and the image well are derived from those so they stay
coherent when a merchant recolors.

Give a page two grounds at most. The atelier band and the testimonials that
follow it deliberately share one — there is no colour change between them.

### Where shared CSS lives

Shopify subsets `{% stylesheet %}` CSS to the files in a page's **render tree**,
so a section only ships the styles of files it actually renders. Two sections
that are never rendered together therefore cannot borrow each other's CSS — the
second one silently loses its styling, with no error anywhere.

Styles used by more than one such section live in a **style module**: a snippet
under `snippets/styles-*.liquid` that renders nothing and carries only a
`{% stylesheet %}` block. Every section that uses those classes renders it.

```liquid
{% render 'styles-account' %}
```

| Module | Used by |
|---|---|
| `styles-account` | the seven `customers/*` sections |
| `styles-cart-table` | cart page, order detail |
| `styles-cart-summary` | cart drawer, cart page, order detail |
| `styles-chips` | collection, search, blog, article |
| `styles-collection-card` | all-collections page, home collection list |
| `styles-facets` | collection grid, search results |

This keeps the CSS on the pages that need it. Putting it in `critical.css`
instead would ship it to every page in the theme; that file is now reserved for
what genuinely is global — the reset, tokens, layout grid, typography, controls
and focus rules.

**When you add a section, run `shopify theme check`.** A `ValidScopedCSSClass`
warning is this bug, not noise: it means you used a class defined in a file the
page does not render. Either move the rule into the section, or promote it to a
style module.

### JavaScript

Six files, all deferred, no libraries, no framework.

| File | Responsibility |
|---|---|
| `overlay.js` | The base for every sheet: edge slide, focus trap, Escape, focus returned to the trigger |
| `reveal.js` | Scroll reveal, with the three guards that keep print and thumbnail capture from coming out blank |
| `cart.js` | Cart AJAX, quantity announcements, add-to-bag results |
| `product.js` | Variant selection, deferred media, the mobile gallery counter, recommendations |
| `facets.js` | Filtering, and moving the one filter form between sidebar and sheet |
| `predictive-search.js` | Debounced predictive search with request cancellation |

Variant selection re-renders the section on the server rather than patching the
DOM from a client-side variant matrix. Availability here is per combination, and
reproducing Shopify's own calculation in JavaScript is how a theme starts lying
about what is in stock.

## Presets

Three, defined in `config/settings_data.json`. A preset carries settings only,
never markup. Where a preset needs a different layout the difference is a section
setting, and the variant templates live in `listings/`.

| Preset | Heading / body | Layout |
|---|---|---|
| **Aurelia** | Playfair Display / Work Sans | 3 up, 660px hero, centred masthead, numbering on |
| **Ledger** | EB Garamond / Assistant | 2 up, left-aligned statement, body one step larger |
| **Plate** | Bodoni Moda / Karla | 4 up, taller hero, dark masthead, numbering off |

## Accessibility

Nine points, each checkable in review.

1. Body and label text meets 4.5:1 on both schemes.
2. Every interactive element shows a visible focus ring — including the option
   pickers, through `label:focus-within > span`.
3. 44px minimum on every control, including quantity steppers and disclosure
   summaries.
4. Availability is never colour alone: unavailable options are dashed, disabled
   and explained in words. Sale is worded. Media type is named, not iconographic.
5. Forms carry real labels, `aria-describedby` error text, `aria-invalid` on the
   failing control and a `role="alert"` summary.
6. Live regions, all polite: filter counts, quantity changes, predictive-search
   counts, gallery position, add-to-bag results.
7. One `h1` per template, every `nav` named, skip link first in tab order.
8. Motion is opacity and a small translate only, off under
   `prefers-reduced-motion`, and force-revealed before print.
9. Layouts hold at 200% zoom and 320px width — hence the `rem` scale and
   `minmax(0, 1fr)` on every grid track containing an image.

### Two rules that break silently

```css
label:focus-within > span { outline: 2px solid var(--color-heading); outline-offset: 3px; }
.eyebrow, .button        { white-space: nowrap; }
```

The first is the only focus indicator the option pickers have; without it the
primary buy control is invisible to keyboard users, and nothing looks wrong. The
second is what stops "Add to bag" wrapping when a merchant substitutes the font —
uppercase plus wide tracking is exactly what breaks on substitution.

## Test data

`scripts/seed.mjs` fills a development store with a fictional catalogue shaped to
exercise the states the design cares about — not just to fill a grid.

```bash
node scripts/seed.mjs --store your-store.myshopify.com --auth      # once per store
node scripts/seed.mjs --store your-store.myshopify.com --dry-run
node scripts/seed.mjs --store your-store.myshopify.com
```

It runs through `shopify store execute`, so it uses the CLI session you already
have: no access token to copy around. Re-running is safe; records are addressed
by handle. Run `--help` for the exact scope list.

It creates the seven metafield definitions, eight pieces across 28 variants, two
collections, a journal with four articles, and the care and contact pages. The
variants are deliberate:

| Piece | What it demonstrates |
|---|---|
| The Signet | Rose gold in size 18 is out — the dashed, explained combination |
| Vieira Earrings | Every variant sold out — the waitlist replaces the button |
| Linha Band | A compare-at price — the worded discount |
| Aurora Cuff | One size of two out — a partial sell-through |
| Mares Pendant | No metafields at all — the ledger's fallback path |

Two things the API will not do, both about a minute in the admin: adding swatch
colours to the Metal option, and pointing the main and footer menus at the new
collections and pages.

Shopify also publishes the CSV its review team uses, at
[Testing assets](https://shopify.dev/docs/storefronts/themes/store/test-theme/assets).
Import that too before submitting — if the theme holds up under it, it holds up
under review.

## Custom data

See [METAFIELDS.md](./METAFIELDS.md). Nothing is required; every read is guarded
and the theme renders correctly on a store that defines none of it.

## Before submitting

- [ ] Replace `theme_documentation_url` and `theme_support_url` in
      `config/settings_schema.json` with the real documentation and support form.
- [ ] Set `theme_author` to the publishing partner.
- [ ] Build the demo store: real photography, real copy, no placeholder text.
- [ ] Run Lighthouse on home, collection and product, desktop and mobile.
      Performance ≥ 60, accessibility ≥ 90.
- [ ] Keyboard-only pass over the buy control, swatches, filter sheet, cart
      drawer and search overlay.
- [ ] Print a page and confirm nothing renders blank.

## License

MIT. See [LICENSE.md](./LICENSE.md).
