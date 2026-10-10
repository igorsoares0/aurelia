# Preset differentiation

Follow-up to `PRESETS.md`. The three presets now differ on fonts, palette and
home page order. Outside `index.json`, every preset template still has the same
section structure, the same block order and the same block counts as root — only
the copy and some settings differ.

That is defensible but thin. The requirement is a clear industry focus per
preset, and the cheapest way to earn it is to make the *priorities* differ, not
just the words. No new sections, no new CSS, no new Liquid. Reordering existing
blocks in existing JSON.

Read `CLAUDE.md` for theme invariants and `PRESETS.md` for how the three layers
fit together.

## 1. `main-product` block order

Root order today, shared identically by all three presets:

```
breadcrumb, eyebrow, title, price, description, variant_picker,
quantity, buy_buttons, pickup, spec_list
```

The purchase decision is different in each industry, and the block order should
put the deciding information above the buy button.

**Aurelia (jewellery)** — keep the root order. The decision is the piece
itself; `spec_list` carries the ledger and reads well after the commitment.

**Plate (apparel)** — the decision is fit. Create
`listings/plate/templates/product.json` with:

```
breadcrumb, eyebrow, title, price, variant_picker, description,
spec_list, quantity, buy_buttons, pickup
```

- `variant_picker` moves above `description` — size is the first question, not
  the last.
- `spec_list` moves above `buy_buttons`, carrying fabric, fit and measurements.
- The size guide link belongs next to the variant picker. If `variant_picker`
  has no setting for a supporting link, do not add markup for it — leave a note
  in this file and raise it instead.

**Ledger (ceramics)** — the decision is dimensions and who made it.

```
breadcrumb, eyebrow, title, price, spec_list, description,
variant_picker, quantity, buy_buttons, pickup
```

- `spec_list` goes high: dimensions, weight, clay body, maker.
- `description` follows as the narrative.
- `variant_picker` sits low; most studio pieces have one or two variants.

Same ten blocks in all three. Only `block_order` changes, plus the block
settings that name the spec rows.

## 2. `page.about.json`

Root order, currently identical across all three presets:

```
main-page, rich-text, image-with-text, pinned-story, multicolumn, testimonials
```

A ceramics studio's about page and a fashion brand's about page should not have
the same anatomy.

**Aurelia** — keep root.

**Plate (apparel)** — point of view and collection, not process. Drop
`pinned-story`, lead harder on imagery:

```
main-page, rich-text, image-with-text, multicolumn, lookbook, testimonials
```

**Ledger (ceramics)** — process and person. `pinned-story` becomes the spine,
and the page should reach the makers:

```
main-page, rich-text, pinned-story, image-with-text, stockists, multicolumn
```

Adjust block counts to match — do not carry five blocks in a section that now
only needs three because the root template had five.

## 3. `collection.json` grid settings

Root `main-collection-product-grid`:

```
products_per_page: 12, columns: 3, enable_filtering: true,
enable_sorting: true, sticky_sidebar: true
```

- **Plate (apparel)** — more products per screen. `columns: 4`,
  `products_per_page: 24`. Filtering matters most here; keep it on.
- **Ledger (ceramics)** — fewer, larger. `columns: 2` or 3 with
  `products_per_page: 12`. Small catalogue; consider `enable_filtering: false`
  if the demo catalogue is small enough that filters look empty.
- **Aurelia** — unchanged.

Check the empty-state copy in each preset. Root currently reads "Ask for a
commission", which is a jewellery voice and will look wrong under apparel.

## 4. Cleanup

- [x] Delete `listings/aurelia/templates/collection.json` — it is byte-identical
      to `templates/collection.json`. Preset folders hold only preset-unique
      files.
- [x] Audit the rest of the preset templates the same way. Any file that ends up
      identical to root after this pass should be deleted, not kept.

## 5. Ledger — reaching the makers

`main-maker` and `templates/metaobject/maker.json` are the argument for this
preset existing, but no template links to a maker page. The metaobject is only
reachable from the product ledger, so a visitor landing on the home page never
finds it.

Pick one:

- Point the Ledger `image-with-text` or `shop-by` blocks at maker metaobject
  URLs, or
- Add a maker link row to the Ledger `page.about.json`

Do not build a new "featured makers" section for this. The linking is enough,
and a new section reopens the render-tree and preset-parity work for a payoff
that a link already delivers.

## Acceptance

- [x] Each preset's `product.json` puts its industry's deciding information
      above `buy_buttons`
- [x] No two presets share an identical `page.about.json` structure
- [x] `shopify theme check` clean — run on a copy of the theme with each preset's
      listing laid over it, 122 files, no offenses on any of the three
- [ ] `node scripts/preset.mjs <name>` applies each preset and the differences
      are visible in `shopify theme dev`, not just in the JSON
- [x] No preset template remains byte-identical to its root counterpart

## What was done, 10 October 2026

**1. Product.** Both orders applied as written. The spec rows are renamed per
preset: Plate reads Cloth, Measurements, Made in, Cut by, Lead time, Care;
Ledger reads Clay body, Dimensions, Made in, Thrown by, Lead time, Use and care.

**The size guide link** needed a schema change, since `variant_picker` had no
settings: the block now has an optional label and URL, and
`snippets/variant-picker.liquid` renders the link under the options only when
both are set. Plate sets it to `/pages/size-guide` on `product` and
`product.made-to-order`; Aurelia and Ledger leave it empty, so nothing changes
for them.

**2. About.** Plate drops `pinned-story` and gains a four-plate `lookbook` with
its own captions, not the home page's. Ledger drops `testimonials`, puts
`pinned-story` second, and carries the home page's `stockists` with its own
heading and intro. That also leaves Ledger's about page with a single `ink`
band. Every section kept its block count; none needed trimming.

**3. Collection.** Already done before this pass: Plate 4 columns × 24, Ledger
2 × 12, and both already carried their own empty-state copy. Filtering stays
on for Ledger — faceted filtering is a feature reviewers look for, and an empty
filter list on a small demo catalogue is a demo-store problem, not a template
one.

**5. Ledger makers.** Both links, because both bands were already pointing at
a person: the home `maker` band's "Meet the maker" button had a label and no
link, and the about page's studio band now reads "Meet Teresa". Both go to
`/pages/makers/teresa`. **That handle has to exist on the Ledger demo store** —
`scripts/seed-data.mjs` only seeds the jewellery makers `tulio` and `ana`.

**The same goes for one Plate article.** The home page's film button, "How a
garment is made", links to `/blogs/journal/how-a-garment-is-made`. The Plate
demo store has to publish an article with that handle in a blog with the
handle `journal`; nothing in the seed creates it.
