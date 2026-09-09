# Presets

How presets work in this theme, and the plan for repositioning Plate and Ledger
onto their own industries.

Theme invariants live in `CLAUDE.md`. Do not restate them here — if a rule
about styling, tokens, style modules or locales seems to be missing from this
file, it is in `CLAUDE.md` and still applies.

## The three layers

A preset is not a theme. Aurelia is one codebase, one ZIP, one review, one
update cycle. What varies between presets lives in exactly three places.

**Layer 1 — `config/settings_data.json`.** Global settings only. No markup.
The three presets currently differ on ten keys and nothing else:

| Key | Aurelia | Ledger | Plate |
|---|---|---|---|
| `type_heading_font` | Playfair Display | EB Garamond | Bodoni Moda |
| `type_body_font` | Work Sans | Assistant | Karla |
| `type_base_size` | 16 | 17 | 16 |
| `max_page_width` | 1440 | 1360 | 1560 |
| `product_card_image_ratio` | portrait | tall | portrait |
| `piece_numbering` | on | on | off |
| `color_schemes` | own `ground` + `ink` palette per preset | | |

Everything else — `cart_type`, `min_page_margin`, `motion_reveal`,
`product_card_price`, `product_card_spec`, `product_card_swatches`,
`cart_show_note` — is identical across all three and should stay that way
unless there is a reason tied to the industry.

**Layer 2 — `listings/<preset>/`.** This is Shopify's own submission format, not
a convention of this repo: the Theme Store requires that "if you have more than
one preset, you need to include a unique set of templates showcasing each
preset", and `shopify theme package` puts the folder in the ZIP even though
`.shopifyignore` keeps it out of `theme dev` and `theme push`.

**Whether an omitted template falls back to the root is undocumented.** The
requirements page says nothing about inheritance, and theme check does not
enforce completeness. Both possible behaviours are bad — inherit and a preset
shows another industry's copy, do not inherit and the page is missing — so the
rule here is to override every template that carries copy, and not to rely on
the answer. Ask the Partner Dashboard before betting on it.

Current state:

```
listings/aurelia/templates/  index, collection                        (2)
listings/plate/templates/    16 templates
listings/plate/sections/     header-group.json    # dark masthead, Plate only
listings/ledger/templates/   16 templates
listings/ledger/sections/    header-group.json    # announcement copy
```

Aurelia holds two because it *is* the root's voice; the other two override every
template that carries industry copy. What deliberately stays inherited, because
it is functional and says nothing about an industry: `article`, `blog.editorial`,
`page.contact`, `page.json`, `search`, and the seven `customers/*`.

Two templates could not be rewritten by settings alone:

- **`page.size-guide`** is irreducibly a ring sizer — its blocks are `label` plus
  `circumference`, drawn as circles at 1:1 for printing. Plate and Ledger swap
  the whole section for `comparison`: a measurements table and a dimensions
  table. A listing template may change which sections it uses; only the settings
  of a given section are fixed by its schema.
- **`product.made-to-order`'s `engraving` block** exposes only `max_characters`;
  its label comes from the locale and would read "engraving" on any preset. Both
  presets drop the block rather than mislabel it.

**Layer 3 — the demo store.** Catalogue, photography and copy are not in the
theme and never will be. Each preset needs its own demo store. Nothing in this
repo can satisfy that; see `SUBMISSION.md`.

## The rule that trips people up

Section code is shared. Placement is per preset.

A section built with one industry in mind still lives in `sections/` and still
appears in the editor for every merchant on every preset. What is
preset-specific is whether `listings/<preset>/templates/index.json` places it.

There is no such thing as a section that only one preset has. Do not try to
build one, and do not gate a section's schema on a preset name.

## Repositioning

Each preset targets one industry rather than three variations on jewellery.
The settings blocks already exist; this is repositioning plus listing
templates, not new design.

### Aurelia — jewellery

Unchanged. Keeps `edition`, `spec-ledger`, `size-guide` as the ring sizer,
`piece_numbering` on.

### Plate — apparel

Already the closest fit: Bodoni Moda with Karla, 1560 page, portrait card,
numbering off, dark masthead.

- `size-guide` is the load-bearing section here. Retarget the page template
  from ring sizing to garment measurements and fit. The 1:1 print path stays
  useful for a tape-measure reference but is no longer the point.
- `pairing` reads as "complete the look" — more natural for apparel than for
  jewellery.
- `comparison` becomes a fabric table: composition, weight, care, origin.
  Same `styles-ledger` module, different row labels.
- Keep `lookbook` and `video-with-text` prominent on the home page.
- `piece_numbering` stays off, but keep it available for limited drops.

### Ledger — homeware and ceramics

The most textual preset — EB Garamond, 17px body, tall card, narrow 1360 page.
Provenance is the central argument in studio ceramics, which makes
`main-maker` and `templates/metaobject/maker.json` the reason this preset
exists rather than a nice detail.

- Home page leads on `pinned-story` for the making process.
- `stockists` matters here; ceramics brands sell through physical shops.
- Turn `piece_numbering` **on** — numbered runs are the norm in studio
  ceramics, and the setting is already on for this preset.
- `comparison` becomes a clay or glaze table.
- `size-guide` is not relevant; leave it off the preset's templates.

## Work items

Done, 9 September 2026. Both home templates rewritten, theme check clean at 129
files, and every section type, block type and setting id validated against the
section schemas.

- [x] `listings/plate/templates/index.json` — reordered for apparel
- [x] `listings/ledger/templates/index.json` — reordered for ceramics
- [x] Each preset's home order reads as a distinct story
- [x] Every section placed exists in `sections/` and validates against its schema
- [x] `listings/plate/templates/page.size-guide.json` — garment measurements
- [x] `listings/ledger/sections/header-group.json` — needed after all, for copy
      rather than proportions: the root masthead announces "free resizing"
- [x] Aurelia: `video-with-text` placed between `pairing` and `atelier`, and
      `edition` between `browse` and `comparison`. Aurelia only, as decided.
- [ ] **`edition`'s `deadline` is hard-coded to `2026-12-01 18:00`** in
      `listings/aurelia/templates/index.json`. Past that date the section
      renders "This chapter has closed" instead of a countdown. Set a real
      deadline on the demo store, and move this date before any submission
      that lands near it.

### What the three orders are now

The three presets no longer share an order, and no longer share a word of copy.

```
Aurelia   banner statement ribbon press chapter browse edition comparison
          lookbook pairing film atelier kept provenance journal questions ugc

Plate     banner statement ribbon lookbook chapter browse pairing film
          comparison atelier kept press journal questions ugc

Ledger    banner statement ribbon provenance chapter maker comparison browse
          pairing lookbook kept journal stockists questions ugc
```

**Plate** leads on the lookbook, because apparel does. `film` is
`video-with-text`, placed for the first time — it was written and on no
template. `pinned-story` is dropped: the film tells the making story and the
home page stays at fifteen sections, which is what the Lighthouse budget was
measured against. `comparison` is the three cloths, on composition, weight,
care and origin.

**Ledger** leads on `pinned-story`, because provenance is the argument in studio
ceramics. `maker` is `image-with-text` pointing at the maker metaobject page.
`stockists` is placed on the home page, not just its own page. `comparison` is
the glaze table. The lookbook falls to tenth — the table set is the payoff, not
the opening.

**Aurelia** is the only preset with `edition`, and now the only one at
seventeen sections. `edition` sits after `browse` — the grid, the routes in,
then the one piece with a date on it. `film` sits before `atelier` because its
button ("How a piece is made") leads straight into that band.

Every preset holds to one continuous `ink` band and two scheme changes on the
whole page. Ledger's `kept` was moved back to `ground` for this: it was a second
ink island four sections away from `maker`, which is the thing the README rule
exists to prevent.
