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
| `custom.made_in` | Single line text | The **Made in** row — place and maker |
| `custom.care` | Multi-line text | The **Care** row |

The four ledger rows are independent. Define one and only that row appears; the
labels are editable in the theme editor, on the product section's
**Specification row** block.

## Example values

```
custom.piece_number    04
custom.piece_total     24
custom.specification   18k recycled gold, 9.4g
custom.material        18k recycled gold, 9.4g
custom.face            13 × 11mm oval, brushed
custom.made_in         Belo Horizonte, by Túlio
custom.care            Warm water, soft cloth. Free polishing forever.
```

## What the theme does not use metafields for

Color and image swatches come from Shopify's own product option swatches
(**Products → Options → Swatch**), not from a metafield. The theme reads
`value.swatch.color` and `value.swatch.image` directly.

Variant availability is never read from a metafield. It comes from
`option_value.variant`, which Shopify computes per combination.
