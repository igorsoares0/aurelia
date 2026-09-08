# Metafields

Aurelia reads a small set of product metafields. **None of them are required.**
Every read is guarded, so a store that defines none of these renders correctly —
the piece number simply does not appear, and the specification ledger falls back
to the product's own vendor, type, SKU and weight.

Define them in **Settings → Custom data → Products** in the Shopify admin.

## Definitions

| Namespace and key | Type | Where it appears |
|---|---|---|
| `custom.piece_number` | Single line text | The eyebrow on a product card, on the product page and on the edition section (`No. 04`); the order detail line; the care record on the account page |
| `custom.piece_total` | Single line text | Pairs with `piece_number` on the product page and the edition section to read `No. 04 / 24`; the edition section also uses it for the pieces-remaining line |
| `custom.specification` | Single line text | The line under the title on a product card |
| `custom.material` | Single line text | The **Material** row of the specification ledger |
| `custom.face` | Single line text | The **Face** row — dimensions and finish |
| `custom.made_in` | Single line text | The **Made in** row — the place |
| `custom.maker` | Metaobject reference (`maker`) | The **Made by** row, linked to that maker's page |
| `custom.lead_time` | Single line text | The **Lead time** row. Used by the made-to-order product template |
| `custom.care` | Multi-line text | The **Care** row |

The ledger rows are independent. Define one and only that row appears; the
labels are editable in the theme editor, on the product section's
**Specification row** block.

## Example values

```
custom.piece_number    04
custom.piece_total     24
custom.specification   18k recycled gold, 9.4g
custom.material        18k recycled gold, 9.4g
custom.face            13 × 11mm oval, brushed
custom.made_in         Belo Horizonte
custom.lead_time       28 days from order, then three days to ship
custom.care            Warm water, soft cloth. Free polishing forever.
custom.maker           (a reference to a maker metaobject)
```

## The one metaobject

`maker` is the only metaobject the theme reads, and it is optional in the same
way everything above is: a store that defines none of it renders the ledger
without a **Made by** row, and `templates/metaobject/maker.json` is simply never
reached.

| Field | Type | Notes |
|---|---|---|
| `name` | Single line text | Required. The display name, and the link text in the ledger |
| `role` | Single line text | Shown above the name on the maker's page |
| `place` | Single line text | A row on the maker's page |
| `since` | Single line text | A row on the maker's page |
| `bio` | Multi-line text | The body of the maker's page |
| `portrait` | File | Falls back to the theme's placeholder when absent |

The definition needs the **online store** capability with URL handle `makers`,
or its entries have no URL — the ledger then shows the maker's name as plain
text rather than as a link. That is the intended fallback, not an error.

`scripts/seed.mjs` creates the definition, the entries and the reference
metafield. It needs four scopes earlier versions did not ask for —
`read_metaobject_definitions`, `write_metaobject_definitions`,
`read_metaobjects` and `write_metaobjects` — so a store authorised before the
maker existed has to be authorised again:

```
node scripts/seed.mjs --store <domain> --auth
```

## What the theme does not use metafields for

Color and image swatches come from Shopify's own product option swatches
(**Products → Options → Swatch**), not from a metafield. The theme reads
`value.swatch.color` and `value.swatch.image` directly.

Variant availability is never read from a metafield. It comes from
`option_value.variant`, which Shopify computes per combination.
