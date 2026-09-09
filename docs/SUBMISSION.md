# Submission

Everything between the theme and the Shopify Theme Store that is **not** code.
None of this is work for Claude Code — it needs decisions, photography, and
accounts.

Requirements source: shopify.dev Theme Store requirements. Re-read it before
submitting; it changed substantially in May 2025 and will change again.

## Blocking, and fast

These are in `config/settings_schema.json` under `theme_info` and still hold
placeholder values. A reviewer opens this file early.

- [ ] `theme_documentation_url` — currently points at the Shopify help centre
- [ ] `theme_support_url` — currently points at the Shopify help centre
- [ ] `theme_author` — currently "Aurelia"; needs the real publishing entity
- [ ] Decide who publishes and where support lives. This is a business
      decision, not a text edit, and it gates the text edit.

## Preset naming

- [ ] Check "Aurelia", "Plate" and "Ledger" against existing themes and presets
      on the Theme Store. Preset names cannot collide with anything already
      published. "Plate" and "Ledger" are generic enough to plausibly be taken.
- [ ] Do this **before** investing in a demo store for that preset.

## Tagging, per preset

Each preset gets its own listing page, tagged with:

- [ ] Up to two industries — one primary
- [ ] Exactly one catalogue size, from four categories

The demo store must match the primary industry **and** the catalogue size.
That decides how many products each demo needs.

| Preset | Industry | Catalogue size |
|---|---|---|
| Aurelia | Jewellery | small |
| Plate | Apparel | medium (likely) |
| Ledger | Home / ceramics | small |

Confirm the exact category names against the current requirements page; the
four size buckets have specific product-count definitions.

## Demo stores

The expensive item, and the one an editorial theme lives or dies on. One per
preset, each a complete, functioning store with real catalogue, real
photography, real copy.

- [ ] Aurelia — jewellery. Exercise the states `scripts/seed.mjs` already
      anticipates: sold-out variant with the combination explained, fully
      sold-out product with waitlist, compare-at price, partial sell-through,
      one product with no metafields to prove the fallback.
- [ ] Plate — apparel. Shares studio, model and framing with jewellery. Shoot
      these two together.
- [ ] Ledger — ceramics. Shares nothing with the other two. If the schedule
      slips, this is the preset to defer to the first update.
- [ ] Install store must match the expectations set by each demo store.

Screenshots, per preset:

- [ ] Desktop home, at the required dimensions
- [ ] Mobile home, at the required dimensions — must not be a resized duplicate
      of the desktop shot

## Verification

Not construction. These probably pass; you need to know they do.

- [ ] Lighthouse on the demo store, on the templates the requirements name
- [ ] Keyboard-only pass over every template: visible focus, 44px targets,
      no trap in the drawer, cart or predictive search
- [ ] Print every page type and confirm nothing renders blank
- [ ] 200% zoom and 320px width across all templates
- [ ] `shopify theme check` clean on the final ZIP

## Sequencing

Ship one preset first. Aurelia is the sharpest and has the easiest demo.

New themes may submit an update every two weeks for the first two months —
the four-week minimum between updates does not apply during that window. That
makes the phased route cheap: approval on one preset, then Plate, then Ledger,
inside roughly six to eight weeks, each with a demo done properly and with the
reviewer's patterns already known.

Adding a preset later is a documented path: edit the code to add the preset,
submit a new ZIP as a theme update including the new preset's demo URL and
password, then fill in that preset's listing page in the Partner Dashboard
after approval.

Submitting three at once means three demo stores built under pressure and
three surfaces for a first-time rejection. Three mediocre demos are worth less
than one excellent one.
