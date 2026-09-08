/**
 * The fictional catalogue for the Aurelia development store.
 *
 * The products are shaped to exercise the states the design actually cares
 * about, not just to fill a grid. Read the `exercises` note on each one — if
 * you change a price or an inventory number, you may switch off the state it
 * was there to demonstrate.
 *
 * Copy follows the voice specified in the handoff: numbers rather than
 * adjectives, sentence case, no exclamation marks, constraints said out loud.
 */

export const METAFIELD_DEFINITIONS = [
  {
    key: 'piece_number',
    name: 'Piece number',
    type: 'single_line_text_field',
    description: 'Position of this piece within its chapter. Shown as the eyebrow.',
  },
  {
    key: 'piece_total',
    name: 'Chapter size',
    type: 'single_line_text_field',
    description: 'How many pieces the chapter holds. Pairs with the piece number.',
  },
  {
    key: 'specification',
    name: 'Specification line',
    type: 'single_line_text_field',
    description: 'The single line under the title on a product card.',
  },
  {
    key: 'material',
    name: 'Material',
    type: 'single_line_text_field',
    description: 'The Material row of the specification ledger.',
  },
  {
    key: 'face',
    name: 'Face',
    type: 'single_line_text_field',
    description: 'Dimensions and finish. The Face row of the ledger.',
  },
  {
    key: 'made_in',
    name: 'Made in',
    type: 'single_line_text_field',
    description: 'Place and maker. The Made in row of the ledger.',
  },
  {
    key: 'care',
    name: 'Care',
    type: 'multi_line_text_field',
    description: 'The Care row of the ledger.',
  },
];

const METALS = ['18k yellow gold', '18k rose gold', 'Silver 950'];
const SIZES = ['14', '16', '18', '20'];

/**
 * `unavailable` marks a combination that exists as a variant but is stocked at
 * zero, which is what produces the dashed state in the picker. `absent` marks a
 * combination that is not created at all.
 */
export const PRODUCTS = [
  {
    handle: 'the-signet',
    title: 'The Signet',
    exercises: 'State 7a — swatches, and one metal/size combination out of stock',
    description:
      '<p>A flat oval face on a tapered band, cut and finished by hand. The face takes an engraving of up to three characters; engraved pieces are final sale.</p><p>Made to order in 21 days.</p>',
    type: '18k recycled gold',
    vendor: 'Aurelia',
    tags: ['Rings', 'Autumn chapter', 'Made to order'],
    metafields: {
      piece_number: '01',
      piece_total: '24',
      specification: '18k recycled gold, 9.4g',
      material: '18k recycled gold, 9.4g',
      face: '13 x 11mm oval, brushed',
      made_in: 'Belo Horizonte, by Tulio',
      care: 'Warm water, soft cloth. Free polishing forever.',
    },
    options: [
      { name: 'Metal', values: METALS },
      { name: 'Size', values: SIZES },
    ],
    variants: METALS.flatMap((metal) =>
      SIZES.map((size) => ({
        options: { Metal: metal, Size: size },
        price: metal === 'Silver 950' ? '2180.00' : '4280.00',
        // Size 18 in rose gold is deliberately out: this is the combination the
        // picker must dash and explain in words.
        quantity: metal === '18k rose gold' && size === '18' ? 0 : 4,
      }))
    ),
  },

  {
    handle: 'linha-band',
    title: 'Linha Band',
    exercises: 'State 7c — a worded discount and a compare-at price',
    description:
      '<p>A single line turned around the finger, 2.1mm wide. The last of the archive stock; archive pieces are final sale.</p>',
    type: '18k recycled gold',
    vendor: 'Aurelia',
    tags: ['Rings', 'Archive'],
    metafields: {
      piece_number: '02',
      piece_total: '24',
      specification: '18k recycled gold, 3.2g',
      material: '18k recycled gold, 3.2g',
      face: '2.1mm band, polished',
      made_in: 'Belo Horizonte, by Ana',
      care: 'Warm water, soft cloth. Free polishing forever.',
    },
    options: [{ name: 'Size', values: SIZES }],
    variants: SIZES.map((size) => ({
      options: { Size: size },
      price: '1840.00',
      compareAtPrice: '2300.00',
      quantity: 3,
    })),
  },

  {
    handle: 'vieira-earrings',
    title: 'Vieira Earrings',
    exercises: 'State 7b — every variant sold out, so the waitlist replaces the button',
    description:
      '<p>A shell form in two halves, hinged so it moves. The chapter is closed and these are not made again.</p>',
    type: 'Silver 950',
    vendor: 'Aurelia',
    tags: ['Earrings', 'Closed chapter'],
    metafields: {
      piece_number: '03',
      piece_total: '24',
      specification: 'Silver 950, 6.8g the pair',
      material: 'Silver 950, 6.8g the pair',
      face: '18 x 14mm, brushed',
      made_in: 'Belo Horizonte, by Tulio',
      care: 'Warm water, soft cloth. Silver darkens; we re-polish free.',
    },
    options: [{ name: 'Finish', values: ['Brushed', 'Polished'] }],
    variants: [
      { options: { Finish: 'Brushed' }, price: '1420.00', quantity: 0 },
      { options: { Finish: 'Polished' }, price: '1420.00', quantity: 0 },
    ],
  },

  {
    handle: 'sal-pendant',
    title: 'Sal Pendant',
    exercises: 'The simple case — one variant, full ledger',
    description:
      '<p>A grain of salt cast in gold, hung on a 45cm chain. Small enough to be worn under a shirt.</p>',
    type: '18k recycled gold',
    vendor: 'Aurelia',
    tags: ['Pendants', 'Autumn chapter'],
    metafields: {
      piece_number: '04',
      piece_total: '24',
      specification: '18k recycled gold, 2.1g',
      material: '18k recycled gold, 2.1g',
      face: '6 x 5mm, cast texture',
      made_in: 'Belo Horizonte, by Ana',
      care: 'Warm water, soft cloth. Free polishing forever.',
    },
    options: [],
    variants: [{ options: {}, price: '2640.00', quantity: 8 }],
  },

  {
    handle: 'aurora-cuff',
    title: 'Aurora Cuff',
    exercises: 'Two sizes, one of them out — a partial sell-through',
    description:
      '<p>An open cuff in a single piece, forged rather than cast. It holds its shape and can be opened by hand to a point.</p>',
    type: 'Silver 950',
    vendor: 'Aurelia',
    tags: ['Bracelets', 'Autumn chapter'],
    metafields: {
      piece_number: '05',
      piece_total: '24',
      specification: 'Silver 950, 24g',
      material: 'Silver 950, 24g',
      face: '9mm wide, hammered',
      made_in: 'Belo Horizonte, by Tulio',
      care: 'Warm water, soft cloth. Silver darkens; we re-polish free.',
    },
    options: [{ name: 'Size', values: ['Small', 'Large'] }],
    variants: [
      { options: { Size: 'Small' }, price: '3120.00', quantity: 2 },
      { options: { Size: 'Large' }, price: '3120.00', quantity: 0 },
    ],
  },

  {
    handle: 'rio-chain',
    title: 'Rio Chain',
    exercises: 'Three lengths, all in stock — the plain grid case',
    description:
      '<p>A flat curb chain, each link soldered closed. Three lengths, and we can shorten any of them free.</p>',
    type: '18k recycled gold',
    vendor: 'Aurelia',
    tags: ['Chains', 'Autumn chapter'],
    metafields: {
      piece_number: '06',
      piece_total: '24',
      specification: '18k recycled gold, from 11g',
      material: '18k recycled gold, from 11g',
      face: '3.4mm curb, polished',
      made_in: 'Belo Horizonte, by Ana',
      care: 'Warm water, soft cloth. Free polishing forever.',
    },
    options: [{ name: 'Length', values: ['40cm', '45cm', '50cm'] }],
    variants: [
      { options: { Length: '40cm' }, price: '6840.00', quantity: 5 },
      { options: { Length: '45cm' }, price: '7420.00', quantity: 5 },
      { options: { Length: '50cm' }, price: '8100.00', quantity: 3 },
    ],
  },

  {
    handle: 'ponto-ring',
    title: 'Ponto Ring',
    exercises: 'A single stone, and a price that varies across variants',
    description:
      '<p>One stone set flush into the band, so nothing catches. The stone is bought from a cutter we have used for eleven years.</p>',
    type: '18k recycled gold',
    vendor: 'Aurelia',
    tags: ['Rings', 'Autumn chapter'],
    metafields: {
      piece_number: '07',
      piece_total: '24',
      specification: '18k recycled gold, 4.0g',
      material: '18k recycled gold, 4.0g',
      face: '2.5mm stone, flush set',
      made_in: 'Belo Horizonte, by Tulio',
      care: 'Warm water, soft cloth. Free polishing forever.',
    },
    options: [{ name: 'Stone', values: ['Sapphire', 'Tourmaline', 'Diamond'] }],
    variants: [
      { options: { Stone: 'Sapphire' }, price: '5240.00', quantity: 4 },
      { options: { Stone: 'Tourmaline' }, price: '4680.00', quantity: 6 },
      { options: { Stone: 'Diamond' }, price: '8900.00', quantity: 1 },
    ],
  },

  {
    handle: 'mares-pendant',
    title: 'Mares Pendant',
    exercises: 'No metafields at all — proves the ledger falls back to vendor, type and SKU',
    description: '<p>A tide line pressed into a disc, hung on a 45cm chain.</p>',
    type: 'Silver 950',
    vendor: 'Aurelia',
    tags: ['Pendants'],
    metafields: {},
    options: [],
    variants: [{ options: {}, price: '1180.00', quantity: 7, sku: 'AUR-MAR-01' }],
  },
];

export const COLLECTIONS = [
  {
    handle: 'autumn-chapter',
    title: 'Autumn chapter',
    description:
      '<p>Twelve pieces, made once and then closed. Everything here is cut and finished at the bench in Belo Horizonte.</p>',
    productHandles: [
      'the-signet',
      'sal-pendant',
      'aurora-cuff',
      'rio-chain',
      'ponto-ring',
      'mares-pendant',
    ],
  },
  {
    handle: 'rings',
    title: 'Rings',
    description: '<p>Resizing is free for life, up to three sizes either way.</p>',
    productHandles: ['the-signet', 'linha-band', 'ponto-ring'],
  },
];

export const BLOG = {
  handle: 'journal',
  title: 'Journal',
  articles: [
    {
      handle: 'twenty-one-days',
      title: 'Twenty-one days, and what happens in them',
      author: 'Tulio Ramos',
      tags: ['Making'],
      summary:
        'An order does not pull a piece off a shelf. It starts one. Here is the whole of it, day by day.',
      body: `<p>Nothing here is made before it is ordered. That sounds like a slogan and it is not — it is a constraint, and it costs us three weeks on every order.</p>
<h2>Days one to three: the gold</h2>
<p>The gold arrives as grain, recycled and refined in Sao Paulo. It is weighed against the order, alloyed, and rolled to the thickness the piece needs. A signet band starts at 1.8mm and finishes at 1.4mm.</p>
<h2>Days four to eleven: the bench</h2>
<p>Cutting, forming, soldering. This is the part that cannot be hurried and the part that decides whether the piece is good. A ring is filed by hand four times before anyone looks at it under a loupe.</p>
<blockquote><p>The file does most of the work. The polish only shows what the file already did.</p></blockquote>
<h2>Days twelve to eighteen: setting and finishing</h2>
<p>If there is a stone it goes in here. Flush setting takes a full day for a single stone, because the seat has to be cut to the stone rather than the stone forced into the seat.</p>
<h2>Days nineteen to twenty-one: checking, and the box</h2>
<p>Every piece is weighed again and the weight is written on the card that goes with it. If it is more than 0.2g off what we quoted, we tell you before it ships.</p>`,
    },
    {
      handle: 'where-the-gold-comes-from',
      title: 'Where the gold comes from',
      author: 'Ana Beatriz Lima',
      tags: ['Materials'],
      summary:
        'All of it is recycled, all of it is refined in Sao Paulo, and we can show you the certificate for any piece.',
      body: `<p>There is no such thing as new gold that costs nothing. Every gram mined is a hole in the ground and a volume of water. So we do not buy mined gold.</p>
<h2>What recycled actually means</h2>
<p>It means scrap: old jewellery, industrial offcuts, electronics recovery. It is refined to 999.9 and comes to us as grain. Chemically it is identical to anything mined last week.</p>
<h2>The certificate</h2>
<p>Our refiner issues a certificate per batch. Ask for the certificate on any piece you own and we will send it. Nobody has ever asked, which we think is a shame.</p>
<h2>What we have not solved</h2>
<p>Stones. Traceability on coloured stones is genuinely difficult and we will not claim otherwise. We buy from two cutters we have used for eleven years and we can tell you the country. We cannot tell you the mine.</p>`,
    },
    {
      handle: 'resizing-is-free-for-life',
      title: 'Resizing is free for life, and here is why that is not generous',
      author: 'Tulio Ramos',
      tags: ['House'],
      summary:
        'A ring that does not fit is not worn. A ring that is not worn is a failure, and the fix costs us less than the failure does.',
      body: `<p>Fingers change. They change with the season, with weight, with age, and after a certain age they change permanently. A ring bought at size 16 will not be a size 16 forever.</p>
<h2>Up to three sizes, either way</h2>
<p>Beyond three sizes the proportions stop working — a band sized up five is visibly thinner at the back. At that point we would rather remake the piece, and we will quote for that instead.</p>
<h2>What it costs us</h2>
<p>About forty minutes and a small amount of gold. What it saves us is a piece sitting in a drawer, which is the only outcome we actually care about avoiding.</p>
<h2>How to send it</h2>
<p>Write to us and we send a prepaid insured label. It comes back in about ten days, polished.</p>`,
    },
    {
      handle: 'why-twelve',
      title: 'Why twelve pieces a year',
      author: 'Ana Beatriz Lima',
      tags: ['House'],
      summary: 'Four people at a bench can make about twelve things properly. So we make twelve.',
      body: `<p>The number is not a marketing decision. It is arithmetic.</p>
<h2>The arithmetic</h2>
<p>Four people. A new piece takes roughly six weeks from drawing to first sample, and during those six weeks the same four people are also filling orders. Twelve is what fits.</p>
<h2>What we give up</h2>
<p>Range. There is no everyday line and no entry price. If what you want is a thin gold band under a thousand reais, we do not make it and we will tell you so rather than sell you something else.</p>
<h2>What it buys</h2>
<p>Every piece gets looked at by someone who made it. That is the whole of the argument.</p>`,
    },
  ],
};

export const PAGES = [
  {
    handle: 'about',
    title: 'The house',
    // Uses templates/page.about.json, which carries the story in sections. The
    // body is only the lead paragraph above them.
    templateSuffix: 'about',
    body: `<p>Aurelia is four people and one bench on the second floor of a building in Belo Horizonte. We make about twelve pieces a year, in 18k recycled gold, silver 950 and vermeil, and we finish every one of them ourselves.</p>
<p>A chapter closes when it closes. Nothing is restocked, nothing is made in a season we did not plan, and nothing leaves the room without the person who set it looking at it last.</p>`,
  },
  {
    handle: 'care-and-repair',
    title: 'Care and repair',
    // Uses templates/page.care.json. Without this suffix the template exists
    // but is applied to nothing -- the page falls back to page.json.
    templateSuffix: 'care',
    // The anchored-index layout builds its sidebar from these h2 elements.
    body: `<p>Everything we make can be brought back. Polishing is free forever, resizing is free for life up to three sizes, and repairs are quoted before any work starts.</p>
<h2>Everyday care</h2>
<p>Warm water and a soft cloth. Nothing else is needed and most things marketed for jewellery are worse than water. Take pieces off before swimming in chlorine.</p>
<h2>Silver darkens</h2>
<p>Silver 950 tarnishes; it is what silver does. A soft cloth handles it, and we re-polish free whenever you send a piece in.</p>
<h2>Resizing</h2>
<p>Free for life, up to three sizes either way. Write to us and we send a prepaid insured label. It comes back in about ten days.</p>
<h2>Repairs</h2>
<p>Send it and we will quote before touching it. A snapped chain or a lost stone is usually a same-week job. We do not refuse work on pieces we did not make, but we will say honestly whether it is worth doing.</p>
<h2>What we cannot fix</h2>
<p>Engraved pieces cannot be resized more than one size without the engraving distorting. We say this before you order, and it is why engraved pieces are final sale.</p>`,
  },
  {
    handle: 'contact',
    title: 'Contact',
    // Uses templates/page.contact.json, which adds the contact form section.
    templateSuffix: 'contact',
    body: `<p>A person reads every message. We reply within two working days, and we would rather answer a question before you order than after.</p>
<p>The bench is in Belo Horizonte. Visits are by appointment.</p>`,
  },
  {
    handle: 'faq',
    title: 'Questions',
    // Uses templates/page.faq.json. The groups are collapsible-content
    // sections, so the body stays a lead paragraph -- see the template.
    templateSuffix: 'faq',
    body: `<p>Grouped by what people actually ask, in the order they ask it. Anything not here, write to us and a person answers.</p>`,
  },
  {
    handle: 'gift-guide',
    title: 'Gifting',
    // Uses templates/page.gift-guide.json.
    templateSuffix: 'gift-guide',
    body: `<p>Every piece is made after it is ordered, which is the one thing worth knowing before you buy one for somebody else. Twenty-one days at the bench, sized afterwards for free, and no price anywhere in the parcel.</p>`,
  },
];
