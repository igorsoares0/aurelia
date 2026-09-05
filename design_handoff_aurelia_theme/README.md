# Handoff: Aurelia — premium Shopify theme for a jewellery house

## Overview

A complete design set for an editorial, off-white, luxury jewellery theme intended for
the Shopify Theme Store. Every required storefront template is designed, at desktop and
at 390pt, with real states (sold out, on sale, made to order, validation errors, empty
results, pagination). Three preset styles are defined. WCAG 2.2 AA is treated as a
contract, not a preference.

Brand in the mocks is fictional ("AURELIA", Belo Horizonte, 18k recycled gold, twelve
pieces a year). Copy is English. Replace names and prices with the real catalogue;
keep the **voice**, which is specified.

## About the design files

The files in this bundle are **design references created in HTML** — Design Components
that open directly in a browser. They are prototypes showing intended look, structure and
behaviour. **They are not production code to copy.**

The target environment is a **Shopify Online Store 2.0 theme**: Liquid, JSON templates,
sections with `{% schema %}` and `presets`, `settings_schema.json`, `locales/*.json`.
The task is to **rebuild these designs in that environment**, using Liquid objects and
Shopify's own primitives (`font_picker`, `image_url`, Search & Discovery filters,
predictive search, cart AJAX API, customer account routes) — not to port the HTML.

Concretely, several things in the mocks exist only because a browser mock needs them and
**must not** survive into the theme:

- `<image-slot>` elements are drop-target placeholders. Every one becomes a Liquid image
  with `image_url` + width descriptors and a real `alt`. There are ~90 of them.
- Fonts are loaded from a font CDN because that is what the mock tool can render. The
  theme **must** use two `font_picker` settings (see "Fonts" below). This is a submission
  blocker, not a preference.
- Inline styles are used throughout because the mock streams. The theme should use its own
  stylesheet with the tokens in "Design tokens".
- Prices are hard-coded BRL strings. Use `money` filters and support multi-currency.

## Fidelity

**High fidelity.** Final colours, type scale, spacing, states and copy. Recreate the UI
faithfully. Exact values are in `Aurelia Theme - Style Guide.dc.html` and in
"Design tokens" below.

Two deliberate exceptions, both documented in the Handoff document:

1. Sizes in the mocks are px at a 16px base. **The theme must use `rem`** derived from a
   `type_base_size` setting. Do not hard-code px.
2. Font families in the mocks are placeholders for `font_picker` values.

## Reading order

Read these four first. They are authoritative and they do not overlap.

| # | File | What it is authoritative for |
|---|------|------------------------------|
| 1 | `Aurelia Theme - Handoff.dc.html` | Theme architecture: global settings, the section/block map per template, the type scale, the nine-point accessibility contract, open questions. **Start here.** It is a printable document, not a mock. |
| 2 | `Aurelia Theme - Style Guide.dc.html` | Every control in every state, the palette with measured contrast, the hairline scale, the spacing scale, photography art direction, copy voice, motion rules. **Build components from this file, never by copying a control out of a screen.** |
| 3 | `Aurelia Theme - Storefront.dc.html` | Home, collection, product, PDP variant states, the six additional home sections, desktop-only states (pagination, empty filter result, gallery with video/3D). |
| 4 | `Aurelia Theme - Commerce and Content.dc.html` | Cart drawer and cart page, search overlay and no-results, journal index and article, customer accounts (login, overview, order detail, addresses, register/reset/activate), list-collections, content page, 404, gift card, password page. |

Then these four as needed.

| # | File | What it is for |
|---|------|----------------|
| 5 | `Aurelia Theme - Home Assembled.dc.html` | The home page with all eleven sections in final order, desktop **and** 390pt side by side. Use this for section order and for what restructures at mobile. Large file — slow to load. |
| 6 | `Aurelia Theme - Mobile.dc.html` | Collection, PDP, cart, article, account at 390pt, plus the filter sheet and search overlay. Each mobile screen is **restructured, not scaled** — see "Responsive behaviour". |
| 7 | `Aurelia Theme - Presets.dc.html` | The three preset styles, each with its exact setting values. Feeds `presets` in the theme and the listing's style options. |
| 8 | `Aurelia Theme - Explorations.dc.html` | History: the three original home directions and the font-pair comparison. Reference only — superseded. Do not implement from this file. |

`image-slot.js` and `doc-page.js` are mock-only support files. They have no place in the theme.

Every option in every file carries a stable id badge (`1a`, `2b`, `7a`, `13c`, `16b`…).
Use those ids in commits and questions — they are how the design set is addressed.

## Screens / views

### Home — `index.json`
Eleven sections, in this order. Section order is a merchant choice; this is the default preset.

1. **Announcement bar** — ink ground, 12px uppercase, centred. One line of text.
2. **Header** — three-column grid `1fr auto 1fr`: nav left, wordmark centre (24px Playfair, `.34em` tracking, `text-indent` matching), search + bag right. 26px/44px padding. Bottom hairline `.14`.
3. **Image banner** — full-width image, 640px tall, followed by a magazine caption row: left "Fig. 01 — <piece>, <material>, photographed in <place>", right the chapter name. 13px, `#5C554C`, top hairline `.14`.
4. **Rich text (statement)** — centred, max-width 1000px, 110px/96px vertical padding. Eyebrow 12px uppercase `.26em` in accent; `h1` 72px/1.08 Playfair with an italic second line; 17px/1.75 lead capped at 520px.
5. **Press** — 12px uppercase heading; one 40px/1.26 Playfair pull quote at max 900px with `<cite>` attribution; five logos in a `repeat(5, minmax(0,1fr))` row, 40px tall, above a `.14` hairline.
6. **Featured collection (the chapter)** — heading row with "View all →"; `repeat(3, minmax(0,1fr))` grid, 52px/36px gap, image 400px, then eyebrow "No. 01" in accent, 22px Playfair title, 14px spec, 14px price.
7. **Lookbook rail** — horizontal `overflow-x` list with `scroll-snap-type: x mandatory`, plates of **different widths** (480 / 360 / 620 / 360) all 600px tall, each with a two-part caption under a hairline. `tabindex="0"` and an `aria-label` naming the gesture-free alternative.
8. **Image with text (atelier)** — ink ground, `minmax(0,1.1fr) minmax(0,1fr)`, 72px gap. Eyebrow in `#C9A96A`, 42px Playfair, 16px/1.8 body in `#D8D2C6`, outlined button that inverts on hover.
9. **Testimonials** — continues the ink ground (no colour change between 8 and 9 — the page has only two grounds). `repeat(3, minmax(0,1fr))`, each quote 24px/1.4 Playfair over a `.28` top hairline; attribution is name + piece + year under a `.2` hairline. **No avatars.**
10. **Journal** — three latest as full-width rows, `140px 120px minmax(0,1fr) auto`: topic in accent, 120×82 thumb, 25px Playfair headline, date + read time. Row hover `#EFEBE2`.
11. **FAQ** — `minmax(0,360px) minmax(0,1fr)`, 64px gap. Native `<details>`, first one `open`, `summary` 20px Playfair at 56px min-height with a `−`/`+` glyph in accent, answer capped at 52ch.
12. **UGC** — 12-column grid, one row, five figures with explicit heights (420/250/330/230/300) and staggered `margin-top` (0/64/0/96/28). Each figcaption credits the handle and the piece. Header states the permission rule.
13. **Footer** — newsletter left with a real `<label>`, two navs right, each link 44px min-height.

### Collection — `collection.json`
Breadcrumb; chapter eyebrow; 64px `h1`; intro at 420px. Then `238px minmax(0,1fr)`, 52px gap:
sticky filter sidebar (`<fieldset>`/`<legend>` per group, counts in the label, result count in
`role="status"`) and a `repeat(3, minmax(0,1fr))` grid at 52px/34px.

- **Paginated variant** (`13a`): 4-up at 36px/24px, image 250px, and a pagination nav where
  every page link is a 44×44 target. The inert "Previous" is a `<span>`, not a disabled anchor,
  with an off-screen "You are on page 1 of 24".
- **No-results variant** (`13b`): filters stay applied and visible; an outlined box states the
  cause in words ("No silver piece carries stones this chapter… it's the pair that empties the
  shelf"), offers "Clear both filters" and a commission link, then shows near alternatives.

### Product — `product.json`
`minmax(0,1.25fr) minmax(0,1fr)`. Left: 760px hero then two 420px details in a 2-up.
Right: sticky panel at 52px/46px padding — breadcrumb, eyebrow, 52px `h1`, price with
instalments, description, then the form, then a `<dl>` spec ledger with `.10` row hairlines.

The **variant picker must survive all of these** (`7a`–`7d`):

- **Swatches** — metal and finish. Colour dot **plus name**, always. Unavailable-for-this-combination
  is dashed **and** explained in text below the group. Availability is per combination, not per option.
- **Sold out** — no dead button. A one-piece waitlist with its own label, plus a commission route.
  Esgotado variants stay visible, dashed.
- **On sale / made to order** — discount worded ("Save 20% — archive price") as well as coloured,
  old price in `<s>`, lead time stated in a callout **before** the button.
- **Validation** — `role="alert"` summary, `aria-invalid` on the group, persistent message tied by
  `aria-describedby`, and a post-failure cart error in `role="status"`.

**Gallery with video and 3D** (`13c`): media type is named in the visible badge **and** the
`aria-label` ("Video, 24 seconds: the Signet turning"), never a bare icon. Video never autoplays
and has no sound. Play button sits bottom-left, not centred.

### Cart — `cart.json` + drawer
Both exist; `cart_type` chooses. Drawer: `role="dialog" aria-modal`, quantity in `aria-live`,
gift note inline, summary and checkout pinned. Page: a real `<table>` with `<caption>` and
`scope`, house-services checkboxes, order note, discount field, sticky summary aside.
Empty state has its own copy and a "Most kept" pair.

### Search — `search.json` + header overlay
Overlay: `role="dialog" aria-modal`, a 34px Playfair search input, count in `aria-live`,
three columns of suggestions / journal / product results. No-results page names the query
and routes to the chapter or a commission.

### Journal — `blog.json`, `article.json`
Index: 64px `h1`, tag filters as chips (current one filled), a lead article in
`minmax(0,1.2fr) minmax(0,1fr)`, then a 3-up of 250px cards. Article: centred 50px `h1`,
470px hero with `<figcaption>`, body at 152px side padding with a 62px Playfair drop cap,
a rule-bounded pull quote, and prev/next in a 2-up with a divider.

### Customer accounts — `customers/*`
- **login** — error demo included: `role="alert"` banner, `aria-invalid`, `aria-describedby`, a
  1.5px `#8C2F1D` border. Guest route stated at the bottom.
- **account** — 52px name, sticky section nav with a 2px active marker, orders in a `<table>`
  with `scope="row"` on the order number, then "Your pieces — care record" as 3-up cards
  reading a piece metafield.
- **order** (`15a`) — the making progress **is** the page: four steps as top-hairline columns
  (done / done / in progress in accent / pending, the current one `aria-current="step"`),
  a `role="status"` explanation, the line item showing its piece number, summary and a
  still-editable address.
- **addresses** (`15b`) — default marked with a 1.5px ink border; edit form below with correct
  `autocomplete` on every field; postcode explains that it fills city and state.
- **register / reset / activate** (`15c`) — same frame. Reset deliberately does not reveal
  whether the account exists, and says so.

### Utility
`list-collections.json` (2-up, count per collection), `page.json` (two presets: plain, and an
anchored-index variant used by Care & repair), `404.json` (image + two routes, "This piece has
been kept"), `gift_card.liquid` (balance, blocked code, Shopify QR, print, Wallet),
`password.liquid` (newsletter is primary; password entry inside a `<details>` for staff).

## Interactions & behaviour

- **Scroll reveal** — opacity 0→1 with a 20px rise, 900ms, `cubic-bezier(.2,.7,.2,1)`, once per
  element via `IntersectionObserver` (`rootMargin: 0px 0px -12% 0px`, threshold .06).
  Three guards are **required**, all present in the mocks and all learned from real failures:
  nothing is hidden if `document.hidden` is already true at init; elements already in the
  viewport at init are never hidden; and a failsafe reveals everything on `beforeprint` and on
  `visibilitychange`. Without these, print/PDF/thumbnail captures come out blank.
- **Hover** — colour and border only, 150–200ms. Nothing scales, lifts or rotates.
- **Sheets and drawers** — slide from the edge they belong to, 260ms ease-out. Focus moves in,
  is trapped, Escape closes, focus returns to the trigger.
- **Rails** — `scroll-snap-type: x mandatory`, `tabindex="0"`, `aria-label` that names a
  non-gesture alternative ("Drag, or use the arrow keys"). Never autoplay.
- **Never** — parallax, carousel autoplay, counting numbers, letter-by-letter type-in,
  self-starting video, countdown timers, "only 2 left" pressure.
- **Always** — every animation off under `prefers-reduced-motion`.

### Responsive behaviour

Mobile is **restructured, not scaled**. What changes at 390pt:

| Element | Desktop | 390pt |
|---|---|---|
| Collection filters | sticky sidebar | sticky Filter/Sort bar → modal bottom sheet, removable chips above the grid |
| Product grid | 3-up (4-up when paginated) | 2-up |
| PDP gallery | stacked hero + 2-up details | snap carousel with a live `1 / 3` counter |
| PDP buy panel | sticky right column | condensed pinned bottom bar: variant summary, price, Add to bag |
| PDP specs | `<dl>` ledger | `<details>` disclosures |
| Cart | table + sticky aside | full-screen sheet, summary pinned, notes collapsed |
| Lookbook / testimonials | grid and wide rail | swipe rails |
| Atelier band | 2-column | image over text |
| Press logos | five | three |
| UGC | staggered 12-col mosaic | even 2-up |
| Account orders | `<table>` | cards; section nav becomes a scroll rail |
| Article measure | 152px side padding | capped at 38ch |
| Footer navs | three columns | two-column link list |

## State management

Client state is small; Shopify owns the rest.

- Cart — Shopify cart AJAX API. Drawer open/closed, per-line quantity (announced politely),
  add-to-bag pending/success/error.
- Variant selection — selected options → matched variant → availability **per combination**,
  price, media, and the enabled/disabled state of each option value. Update the URL.
- Filters — Search & Discovery. Active filters, result count in a live region, sheet open/closed
  on mobile.
- Predictive search — query, debounce, results, count in a live region, overlay open/closed.
- Gallery — selected media index, media type, 3D/zoom viewer open.
- Forms — per-field validity, error message, `aria-invalid`, and a summary in `role="alert"`.

## Design tokens

### Colour

| Token | Hex | Use | Contrast on its ground |
|---|---|---|---|
| ground | `#F5F2EC` | every light surface | — |
| image well | `#EDE8DF` | before the photo loads | — |
| tint | `#EFEBE2` | chip, row hover, quiet callout | — |
| ink | `#16130F` | text, and the dark section ground | 15.4:1 |
| body | `#463F38` | body copy | 8.0:1 |
| secondary | `#5C554C` | labels, captions | 5.6:1 |
| accent | `#7A5E30` | accent **on light only** | 5.4:1 |
| accent on dark | `#C9A96A` | accent inside ink sections | 8.3:1 on ink |
| error rule | `#8C2F1D` | borders, left rules | — |
| error text | `#6E2416` | error copy | 6.9:1 |
| progress | `#2E4028` on `#E4E9E1` | in-workshop badge | 7.4:1 |

Two grounds per page, no more. **Never** tint body text with alpha to quieten it — step down
this list instead. A merchant colour override must be validated at 4.5:1, not trusted.

### Hairlines — the visual language

`rgba(22,19,15,α)`: `.10` between list rows · `.14` between sections and at header/footer edges ·
`.18` under a group heading and for box outlines · `.30` for field and control borders ·
`1.5px #16130F` for selected state and table header rules.

Rules do the work cards and shadows do elsewhere. **One shadow** exists in the whole theme —
under a sheet or drawer floating above the page. **No border radius anywhere** except the
16px metal swatch dot.

### Spacing — 4px base

`4 · 8` inside a control, label to field · `12 · 16` between sibling controls, mobile grid gap ·
`20 · 24` mobile gutter, card padding · `36` desktop product grid gap · `44` desktop gutter
**and the touch-target floor** · `80 · 96` between home sections · `110` around a lone statement.

Sibling groups use flex/grid + `gap`, never per-element margins.

### Typography

Two `font_picker` settings drive everything; there are **no per-section font settings**.
Sizes are `rem` off `type_base_size` (range 15–18px, default 16).

| Role | Family / weight | Size |
|---|---|---|
| Display / h1 | heading 400 | 4.5rem desktop → 2.375rem mobile, lh 1.06–1.12 |
| Section h2 | heading 400 | 2.5rem, lh 1.2 |
| Product title h3 | heading 400 | 1.375rem, lh 1.25 |
| Body lead | body 400 | 1.0625rem, lh 1.7 |
| Body | body 400 | 0.9375rem, lh 1.7 |
| Label / eyebrow | body 500 | 0.75rem, `.18–.26em` tracking, uppercase |

Hard rules: **body copy is never weight 300** (it was, and it failed on a high-contrast serif).
**No label below 12px.** Uppercase labels always carry `.16–.18em` tracking and
**`white-space: nowrap`** — uppercase plus wide tracking is exactly what wraps when a merchant
substitutes the font, and a wrapped Add to bag looks broken. Constrain a display headline in
`em` of its own size or in px — **never `ch`**, which resolves against the inherited body font.

### Controls

Primary button 52px, secondary 48px, everything else 44px minimum — including quantity
steppers, chip remove buttons, disclosure summaries, pagination links, header wordmarks and
footer links. Inline links inside a sentence are exempt.

Fields 48px, 14px horizontal padding, `.30` border. A placeholder is an example, never a label.
Error text sits under the field, tied by `aria-describedby`, and says what to do.

**The rule that breaks silently:** option pickers (size, metal, finish) hide the real
`<input>` and style a visible `<span>`, so the focus ring must be drawn on that child —
`label:focus-within > span { outline: 2px solid #16130F; outline-offset: 3px }`.
Lose that rule and the primary buy control becomes invisible to keyboard users.

### Fonts — submission blocker

The mocks load Playfair Display + Work Sans (and EB Garamond/Assistant, Prata/Karla for the
other presets) from a font CDN. The Theme Store requires all fonts to come from `font_picker`,
with defaults that exist in the current library. **Verify every family handle in the live
`font_picker` before committing the three presets' defaults** — the library changes, and this
is the one item that cannot be resolved from the design files.

## Presets

Three, in `Aurelia Theme - Presets.dc.html`, each with its exact values.

| Preset | Heading / body | Ground · ink · accent · on-dark | Layout |
|---|---|---|---|
| **Chapter** (default) | Playfair Display / Work Sans | `#F5F2EC` · `#16130F` · `#7A5E30` · `#C9A96A` | 3-up, 640px hero, centred masthead, numbering on |
| **Ledger** | EB Garamond / Assistant, body one step larger | `#F3EEE5` · `#191510` · `#6E5A2E` · `#CBAE79` | 2-up, left masthead, left-aligned statement |
| **Plate** | Prata / Karla | `#F7F5F1` · `#14120F` · `#7A4A3A` · `#E0CBA8` | 4-up, full-bleed hero with overlay, dark header, numbering off |

**A preset carries settings only, never markup.** If a direction needs different HTML it is a
section variant, not a preset. This is why the two alternate home directions in
`Explorations` did not become presets — only their palette, type pair and layout flags did.

## Accessibility contract

Nine points, each implemented in the design files and each checkable in review.

1. Body and label text meets 4.5:1 on both schemes. Accent is `#7A5E30` on light,
   `#C9A96A` on dark. Validate merchant overrides.
2. Every interactive element shows a visible focus ring — including custom pickers, via
   the `label:focus-within > span` rule.
3. 44px minimum touch target on every control.
4. Variant availability is never colour alone: dashed **and** explained. Sale is worded.
   Media type is named, not iconographic.
5. Forms: real labels, `aria-describedby` error text, `aria-invalid` on the failing control,
   `role="alert"` summary. Never a placeholder as the only label.
6. Live regions: filter counts, quantity changes, predictive-search counts, gallery position
   and add-to-bag results, all polite.
7. One `h1` per template, no skipped levels, every `nav` named, skip link first in tab order.
8. Motion: reveal is opacity + small translate only, off under `prefers-reduced-motion`, and
   force-revealed before print.
9. Layouts hold at 200% zoom and 320px width — hence the `rem` scale and
   `minmax(0, 1fr)` on every grid track that contains an image.

## Assets

**None are final.** There are roughly 90 `<image-slot>` placeholders across the set; each
carries a description of the intended shot and an `aria-label`. Real photography is the
single biggest change still outstanding and no code change substitutes for it.

Art direction is specified in the Style Guide (`14c`): exactly four kinds of photograph —
**Worn** (3:4, a cropped body, one daylight source; hero and lookbook only), **Object**
(3:4, stone or paper ground in the off-white family, piece fills 60% of frame), **Macro**
(1:1 or 3:4, close enough to see tool marks), **Bench** (4:5 or wide, hands and tools, warm
light, dark sections only).

Never: pure white or black grounds, floating cut-outs, ring boxes, rose petals, gift ribbon,
sparkle overlays, or two pieces competing in one frame. Every image gets a caption or an alt
that says what it is — "Fig. 01 — The Signet, 18k recycled gold", not "jewellery".

No icon set is used. The few glyphs are text characters (`←`, `→`, `×`, `−`, `+`, `▶`).

## Copy voice

Specified with examples in the Style Guide (`14c`). Specific over evocative — three days,
9.4g, size 14, by Túlio; numbers instead of adjectives. Sentence case. No exclamation marks.
Say the constraint out loud (twenty-one days; archive pieces are final sale). No countdowns
or fake scarcity — the scarcity here is real, so state it flatly. Uppercase eyebrows are
nouns, never verbs.

Write "Ready to ship in 3 days", not "Fast shipping!!". Write "Size 18 is unavailable in
brushed yellow", not "Out of stock". Write "Shop the chapter", not "SHOP NOW".

## Still open

1. **Font handles** — verify in the live `font_picker` before committing preset defaults.
2. **Metafields** — piece number, maker name, gram weight, material provenance and care
   history are all designed but not yet defined as metafield definitions.
3. **Not designed** — stockists/store locator, and any localisation-specific layout
   (currency selector, RTL).
4. **Performance budget** — no framework, no jQuery, section JS deferred, images through
   `image_url` with width descriptors. Lighthouse must clear the store threshold on a real
   device, not a laptop.
5. **Listing materials** — demo store content, screenshots, documentation, support channel.
   Screenshots must be captured from single-screen files, not from `Home Assembled`, which
   is too heavy to capture reliably.

## Files

| File | Notes |
|---|---|
| `Aurelia Theme - Handoff.dc.html` | Printable spec document. Read first. |
| `Aurelia Theme - Style Guide.dc.html` | Component and token source of truth. |
| `Aurelia Theme - Storefront.dc.html` | Home, collection, product, variant states, home sections, desktop states. |
| `Aurelia Theme - Commerce and Content.dc.html` | Cart, search, journal, accounts, utility, gift card, password. |
| `Aurelia Theme - Home Assembled.dc.html` | Full home, desktop + 390pt. Heavy. |
| `Aurelia Theme - Mobile.dc.html` | Collection, PDP, cart, article, account at 390pt + filter sheet + search. |
| `Aurelia Theme - Presets.dc.html` | The three preset styles with their setting values. |
| `Aurelia Theme - Explorations.dc.html` | Superseded history. Reference only. |
| `image-slot.js`, `doc-page.js` | Mock support only. Not part of the theme. |

Open any `.dc.html` directly in a browser. Files in canvas mode pan and zoom; use the id
badges (`1a`, `7a`, `13c`, `16b`…) to navigate and to refer to specific options.
