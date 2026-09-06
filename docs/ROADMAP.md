# Roadmap — new sections and templates

Work items for extending the theme. Each is independently shippable. Read
`AGENTS.md` first; the invariants below are the ones people get wrong on this
codebase specifically.

## Status — 6 September 2026

**Sections: all seven written and statically validated**, committed as
`8902054 start 7 home sections`. Written and theme-check clean is not the same as
accepted -- see the acceptance table below. **Templates: none started.**

New files: `sections/{video-with-text,marquee,pinned-story,pairing,comparison,
shop-by,edition}.liquid`, `snippets/{styles-ledger,video-facade}.liquid`,
`assets/{video.js,edition.js}`.

Changed: `assets/cart.js` (the pairing element, and the form-matching fix below),
`sections/{main-product,featured-product,header}.liquid`,
`snippets/{spec-ledger,styles-cart-table}.liquid`, both locale files,
`templates/index.json` and all three `listings/*/templates/index.json`, `README.md`.

**A defect fixed first, because it outranked the whole roadmap.**
`settings.cart_type` had no effect anywhere in the theme. `<aurelia-product-form>`
was defined in `cart.js` but used in no Liquid file, and nothing anywhere opened
`CartDrawer` -- so the drawer was unreachable on every page, and every add-to-bag
was a full-page POST even with `drawer` selected, which is the default. The AJAX
path in `cart.js` had never run. Fixed by wrapping the buy control in
`<aurelia-product-form>` in `main-product` and `featured-product`, and giving the
header bag `data-overlay-open="CartDrawer"` when `cart_type` is `drawer`, keeping
the href as the no-JS route.

One trap came with it: `buy-buttons` renders a waitlist `{% form 'contact' %}` in
its sold-out branch, and `AureliaProductForm` took the *first* form it found. It
now matches `form[action*="/cart/add"]`, or a waitlist submission would have
posted to the cart with no variant id.

**Two things to confirm the moment the theme runs.** Neither is caught by theme
check, and both fail quietly:

1. `row.settings[value_key]` in `comparison.liquid:67,95` -- bracket access with a
   variable key. Standard in Shopify themes, but the first use in this repo. If it
   does not resolve, the comparison cells render empty.
2. The marquee's `animation-play-state: paused` under `prefers-reduced-motion`.
   `critical.css` forces `animation-duration: 0.01ms !important` with one
   iteration, so without the override the band snaps to its end state and carries
   the text off screen.

## Invariants for every item here

- Styling reads tokens from `snippets/css-variables.liquid`. A section never
  reads a theme setting for styling.
- No border radius, anywhere, except the 16px swatch dot. One shadow in the
  theme, already spent. Rules carry the structure.
- Sizes in `rem` off `type_base_size`. px only for fixed image heights that are
  merchant settings.
- No libraries. Vanilla JS, deferred, in `assets/`.
- CSS shared by two sections that never render together goes in a style module
  (`snippets/styles-*.liquid`), rendered by every section that uses it. This
  fails silently otherwise — see the README.
- Every schema string goes in `locales/en.default.schema.json`. Storefront
  strings in `locales/en.default.json`. Theme Check rejects inline text.
- Every new snippet carries a `{% doc %}` header.
- Motion is opacity plus a small translate, off under `prefers-reduced-motion`,
  force-revealed before print.
- Add a preset to each of the three listings in `listings/` (aurelia, ledger,
  plate) once the section is done. A preset missing from one listing makes that
  variant look thinner than the others in the Theme Store.

## Acceptance, for every item

- [ ] `shopify theme check` clean
- [ ] Renders correctly with every setting at default and with no blocks
- [ ] Keyboard-only pass: visible focus on every control, 44px minimum targets
- [ ] Holds at 200% zoom and 320px width
- [ ] Nothing renders blank in print
- [ ] Body and label text at 4.5:1 on both `ground` and `ink`
- [ ] Preset added to all three listings

### Where the seven sections stand against it

Theme check validates Liquid, schema and translations. It does not render
anything, so it closes exactly one of these boxes. The rest need
`shopify theme dev`.

| Box | The seven sections |
|---|---|
| `theme check` clean | **Done.** 116 files, no offenses. |
| Renders at defaults and with no blocks | Written for it, never rendered. |
| Keyboard pass, 44px targets | Not tested. |
| 200% zoom, 320px | Not tested. |
| Nothing blank in print | Not tested. `marquee` and `video-with-text` are the two to watch. |
| 4.5:1 on both schemes | Not measured. Built from tokens that already meet it, which is not the same thing. |
| Preset in all three listings | **Three of seven.** Deliberate -- see "Where the seven were placed". The other four carry a schema preset, so they appear in Add section, but are not in any listing's home page. |

Until that pass is run, the honest description is *written and statically
validated*, not *accepted*.

---

# Sections

**All seven written**, theme check clean, not yet run in a store -- see Status
above. Three deviations from what is written below, each noted at its item: no
autoplay on the video, two markups rather than one in the comparison, and only
three of the seven placed on the home page.

## 1. `sections/video-with-text.liquid`

The theme has no video section at all. This is the gap a Theme Store reviewer
notices first.

**Settings**: `video` (Shopify-hosted), `video_url` (external, YouTube/Vimeo),
poster image (required — the fallback under reduced motion), heading,
body, button label and link, color scheme, layout (video left / video right /
video full-bleed with text beneath), fixed video height per breakpoint.

**Implementation**
- Native `<video>`. No custom controls. `preload="none"`.
- Autoplay is a merchant setting: when on, `autoplay muted loop playsinline`,
  and start playback from an `IntersectionObserver` so offscreen video never
  loads. When off, native controls and the poster.
- Under `prefers-reduced-motion: reduce`, never autoplay — render the poster
  with a play control.
- External URLs render a facade (poster plus play control) that swaps in the
  iframe on click. Do not ship a third-party iframe on first paint.

**Accessibility**: the video needs an accessible name. Decorative background
video gets `aria-hidden` and must carry no information the text does not.

> **Shipped, without the autoplay setting.** The Style Guide lists "video that
> starts itself" under Never, so the merchant is not offered the choice: always a
> poster and an explicit play control. The control is an `<a href>`, not a
> `<button>`, so it still opens the video with JavaScript off. The facade is in
> `snippets/video-facade.liquid`, the swap in `assets/video.js`. Note the premise
> of the first line above is wrong: the theme already supports video, external
> video and 3D in the product gallery. What was missing is a content video
> section, which is not a review gap.

## 2. `sections/marquee.liquid`

Slow horizontal band of editorial text, rules top and bottom. Sits between the
statement and the press row on the home page.

**Settings**: repeatable text blocks, separator character, speed, direction,
color scheme.

**Implementation**
- Two spans, the second `aria-hidden="true"`, translated by `@keyframes`.
- Under `prefers-reduced-motion`, `animation-play-state: paused` — not
  `display: none`, which would hide the content.
- Text uses the `.eyebrow` treatment. Note `.eyebrow` is `white-space: nowrap`
  already; keep it.

> **Shipped as written**, as `.ribbon`. The reduced-motion override is
> load-bearing and easy to lose: `critical.css` already forces
> `animation-duration: 0.01ms !important` with one iteration, which would snap
> the track to its end state and carry the words off screen. Pausing holds it at
> time zero instead.

## 3. `sections/pinned-story.liquid`

One image column held with `position: sticky` while three to five text steps
pass alongside. For provenance narrative: sourcing, cutting, finishing, packing.

**Settings**: image, image side, steps as blocks (eyebrow, heading, body),
color scheme.

**Implementation**
- `sticky` only above the tablet breakpoint. Below it, the section stacks into
  an ordinary sequence and the image appears once, first.
- Zero JavaScript.
- Steps are an ordered list semantically.
- Each grid track containing the image needs `minmax(0, 1fr)`.

> **Shipped as written**, as `.provenance`. `align-self: start` on the media is
> the other load-bearing rule: a grid item stretched to the row height has
> nowhere to travel, and `position: sticky` then silently does nothing.

## 4. `sections/pairing.liquid`

Two to four products presented as a set, with a control that adds all of them at
once. The AOV lever this theme is currently missing.

**Settings**: heading, body, product blocks (2–4), combined-add toggle, whether
to show individual add controls, color scheme.

**Implementation**
- Reuse `snippets/product-card.liquid` and `snippets/buy-buttons.liquid`.
- Combined add posts every variant in one `/cart/add.js` call, handled in
  `assets/cart.js`. Respects `cart_type` — opens the drawer or navigates to the
  cart page accordingly.
- No-JS fallback: each product keeps its own product form.
- If any piece is unavailable, the combined control says which one, in words,
  and stays operable for the rest. Never colour alone, never a disabled control
  with no explanation.
- Result announced through the existing polite live region.

> **Shipped as written.** `<aurelia-pairing>` lives in `cart.js` rather than a new
> asset, because it reuses `postCart`, `sectionsToRender`, `renderSections` and
> `announce`, none of which are exported. The combined control is hidden by
> `aurelia-pairing:not(:defined)` rather than a `no-js` class -- that also covers
> the script failing to load, and it hides from parse time, so there is no flash
> of a button that then disappears.

## 5. `sections/comparison.liquid`

Material comparison — 18k gold against vermeil against silver, on durability,
hypoallergenic, care, price band. The section where the theme's rules do the
work that a card and a shadow do elsewhere.

**Settings**: column blocks (each a material), row labels as a repeatable block,
heading, note beneath, color scheme.

**Implementation**
- A real `<table>` with `<caption>` and `<th scope="col">` / `<th scope="row">`.
- Below the tablet breakpoint it becomes one definition list per column. No
  horizontal scroll.
- Shares its visual language with `snippets/spec-ledger.liquid`. Extract the
  shared rules into `snippets/styles-ledger.liquid` and render it from both —
  this is exactly the render-tree case that fails silently.

> **Shipped, with both markups rather than one.** "No horizontal scroll" and a
> single markup cannot both hold: a table is row-major in the DOM and CSS cannot
> transpose it, and changing `display` on a table drops its role and its `scope`
> associations in every major browser, which CSS cannot put back. So the content
> is written once in the schema and rendered twice, with `display: none` keeping
> exactly one of the two in the accessibility tree. `@media print` names the
> table explicitly, because neither `screen` query matches there.

## 6. `sections/shop-by.liquid`

Attribute-first navigation: by metal, by stone, by occasion. Blocks pairing a
collection link with the 16px swatch dot.

**Settings**: heading, blocks (label, collection, swatch colour or image),
columns per row at each breakpoint, color scheme.

**Implementation**
- The swatch is decorative; the label carries the link text.
- Reuses `styles-collection-card`, or the dot moves into its own
  `styles-swatch-dot` module if both need it.

> **Shipped as `.entries`, and `styles-swatch-dot` was declined.** The dot already
> exists in `product-card` and `variant-picker`, both of which are snippets --
> their CSS travels with them into any render tree, so there is no silent-failure
> case. The style-module rule is for CSS shared by sections that never render
> together, which does not apply here.

## 7. `sections/edition.liquid`

Numbered edition release: countdown to a date, and pieces remaining.

**Settings**: product, release datetime, heading, body, expired behaviour (hide
section / show message), color scheme.

**Implementation**
- Reads `custom.piece_number` and `custom.piece_total` for the "No. 04 / 24"
  line. Guarded like every other metafield read — absent, the line does not
  appear.
- Remaining count comes from `variant.inventory_quantity` and only when
  inventory tracking is on. No invented scarcity, no fallback number.
- Countdown in `<time datetime="...">`, server-rendered to a static value so it
  is correct with JS off. Live updates `aria-live="polite"` on the minute, never
  the second.
- Expiry is handled client-side against the same datetime.

> **Shipped as written, and it is the one item with submission exposure.** The
> Theme Store requirement bans "fictitious countdown timers". A merchant-set date
> is not fictitious, and the remaining count is real tracked inventory with no
> fallback, so it is defensible -- but it is a human reviewer's judgement, and the
> theme's own Style Guide bans countdowns outright. It is a separate section with
> its own asset, so trading the clock for a static `<time datetime>` is a small
> change if you would rather not carry the risk.

### Where the seven were placed

`listings/` holds only `index.json` and `collection.json` per preset, so "add a
preset to each of the three listings" means putting the section on the home page
of all three Theme Store variants. Two things argue against doing that seven
times: home, collection and product are the pages Lighthouse is averaged over
(60 performance, 90 accessibility, desktop and mobile), and whatever goes into a
listing becomes content the demo store has to show -- and the demo stores do not
exist yet.

So three went on the home page, all cheap and all rendering correctly with no
merchant data: `marquee` between the statement and the press row, `shop-by` after
the chapter, `pinned-story` after the testimonials. Still two grounds. The other
four ship with a schema preset only, which is what a merchant needs to find them:
`video-with-text` is the heaviest and belongs on an about page, `comparison` and
`edition` are product and content sections, and `pairing` is product cross-sell.

---

# Templates

**None started.** What follows is the original list, plus what each one was found
to actually need when it was costed on 6 September 2026.

`page.contact.json` and the generic `page.json` exist. These do not.

**None of these is a submission requirement.** Shopify's template documentation is
explicit: *"No template types are required. However, you must have a matching
template for any page type that you want to render."* `MissingTemplate` already
passes, so every page type the theme renders has a template. Everything below is
merchandising value and demo quality, not a review gate.

| Template | Notes |
|---|---|
| `page.about.json` | The house story. Assembled preset, not a blank page. |
| `page.size-guide.json` | Ring sizer. Print at 1:1 with a `@media print` scale check and a 100%-scale warning. This is the one almost no theme gets right. |
| `page.care.json` | Care and repairs, alongside `custom.care`. `seed.mjs` already creates the page; the template is missing. |
| `page.faq.json` | Grouped questions with anchors, distinct from the loose `collapsible-content` on the home page. |
| `page.stockists.json` | Stockists and atelier visits. Address and hours as blocks. No embedded map — no libraries, and the iframe wrecks Lighthouse. Text address plus a directions link. |
| `page.gift-guide.json` | Seasonal, by price band and recipient. |
| `blog.editorial.json` | Alternate blog template: large grid with a lead article, against the current list. |
| `product.made-to-order.json` | Declared lead time, line item property for engraving. Buy control reads as a commission; the ledger gains a lead-time row. |
| `templates/metaobject/maker.json` | Highest value here. `custom.made_in` already reads "Belo Horizonte, by Túlio". Promoting maker and material to metaobjects with their own templates gives linkable provenance pages from the product ledger. Requires metaobject definitions in `scripts/seed.mjs` and a note in `METAFIELDS.md`. |

Every new page template also needs seed data in `scripts/seed.mjs` so a
development store renders it, and an entry in the listings presets where it
belongs in the preset's story.

## What each one actually costs

Costed against the code as it stands, not against the notes above.

**JSON only -- the settings already exist.** No Liquid, no CSS.

- `blog.editorial.json` -- `main-blog` already carries `show_lead`, `columns`,
  `image_height`, `show_excerpt`. The lead-article grid is a settings file.
- `page.about.json` -- assembled from sections that exist, now including
  `pinned-story`, which was built for this page.
- `page.faq.json` -- `collapsible-content` already has `disclosures--sidebar`;
  the anchors come from `main-page`'s `page--index`, which builds its index from
  the real `<h2>` elements in the page body.
- `page.gift-guide.json` -- `featured-collection` plus the new `shop-by`.

**JSON plus one line of seed data.**

- `page.care.json` -- **the trap.** The page the seed creates has handle
  `care-and-repair` and **no `templateSuffix`** (`seed-data.mjs:357`); only
  `contact` has one. Ship the template without adding `templateSuffix: 'care'`
  and you get a file that is never applied to anything.

**JSON plus a small amount of code.**

- `product.made-to-order.json` -- most of it already exists: `main-product` has an
  `engraving` block and `buy_buttons` takes `lead_time`. The only new code is the
  lead-time row in the ledger, which today has four fixed rows fed from
  metafields. Plus a `templateSuffix` on a seed product.
- `page.stockists.json` -- needs a new section for address and hours as blocks.
  The note above is right to refuse an embedded map: a third-party iframe on first
  paint is exactly what costs the Lighthouse score that is actually measured.

**Real work.**

- `page.size-guide.json` -- printing a ring sizer at 1:1 means physical CSS units,
  a 100%-scale warning and a calibration check. None of it shows up in Lighthouse
  or in review; it is quality for the customer holding the paper.
- `templates/metaobject/maker.json` -- the note above understates this. There is
  **not one line of metaobject code anywhere in the repository**. It needs
  definitions and seeding added to `seed.mjs`, a `metaobject_reference` metafield
  (the type is currently decided by a hardcoded ternary at `seed.mjs:387`), the
  template directory, a `METAFIELDS.md` entry -- and **new API scopes, which force
  every existing user to re-run `--auth`**. Easier to ask that of merchants who
  already have the theme than to do it mid-review.

## Not in the original list

- `templates/agents.md.liquid` -- a template type the theme does not have. Served
  at `/agents.md`, described by Shopify as *"the canonical, agent-facing
  description of the store, telling AI agents how to discover and transact with
  it."* Optional and cheap, and the kind of thing that separates a current theme
  from a dated one.

## Suggested order

The four JSON-only templates plus `page.care.json` in one short pass: five
templates for very little work, and they improve the demo, which is what the
submission is actually judged on. Then `agents.md.liquid`. Leave
`metaobject/maker` until after the theme is published.
