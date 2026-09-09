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

**Layer 2 — `listings/<preset>/`.** Preset-specific JSON templates and section
groups. A preset only needs the files it overrides; anything absent is
inherited from the root `templates/` and `sections/`. Preset folders do not
need to hold the same number of files. Current state:

```
listings/aurelia/templates/{index,collection}.json
listings/ledger/templates/{index,collection}.json
listings/plate/templates/{index,collection}.json
listings/plate/sections/header-group.json      # dark masthead, Plate only
```

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

- [ ] `listings/plate/templates/index.json` — reorder for apparel; lookbook and
      video-with-text high, comparison as fabric, pairing as complete-the-look
- [ ] `listings/plate/templates/page.size-guide.json` — garment measurements
- [ ] `listings/ledger/templates/index.json` — reorder for ceramics;
      pinned-story high, maker and stockists present
- [ ] `listings/ledger/sections/header-group.json` — if the narrower page needs
      its own masthead proportions; skip if inherited works
- [ ] Confirm each preset's home order reads as a distinct story, not the same
      order with different fonts. Reviewers see all three side by side.
- [ ] Every section placed in a preset template must already exist in
      `sections/` and carry a preset entry in all three listings where it makes
      sense

Root `templates/index.json` order, for reference when reordering:

```
image-banner, rich-text, marquee, logo-list, featured-collection, shop-by,
comparison, lookbook, pairing, image-with-text, testimonials, pinned-story,
featured-blog, collapsible-content, ugc-gallery
```

Note `video-with-text` and `edition` are on no template. Place `video-with-text`
in Aurelia between `image-with-text` and `lookbook`, and `edition` in Aurelia
only.
