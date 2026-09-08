#!/usr/bin/env node
/**
 * Seeds a development store with the fictional Aurelia catalogue.
 *
 *   node scripts/seed.mjs --store your-store.myshopify.com
 *   node scripts/seed.mjs --store your-store.myshopify.com --only products
 *   node scripts/seed.mjs --store your-store.myshopify.com --dry-run
 *
 * Everything goes through `shopify store execute`, which authenticates with the
 * CLI session you already have. There is no custom app to install and no access
 * token to handle.
 *
 * Safe to re-run. Products, collections, pages and articles are addressed by
 * handle: an existing one is updated rather than duplicated, and metafield
 * definitions that already exist are reported and skipped.
 *
 * This creates real records in a real store. Point it at a development store.
 */

import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  METAFIELD_DEFINITIONS,
  METAOBJECT_DEFINITIONS,
  MAKERS,
  PRODUCTS,
  COLLECTIONS,
  BLOG,
  PAGES,
} from './seed-data.mjs';

const exec = promisify(execFile);

/**
 * On Windows the CLI is `shopify.cmd`, an npm shim. Node refuses to spawn a
 * `.cmd` without a shell (it has done since the fix for CVE-2024-27980), so
 * Windows needs `shell: true`.
 *
 * That would normally mean shell-quoting a multi-line GraphQL document full of
 * braces and quotes, which is exactly how injection bugs and mangled queries
 * happen. Instead the query and variables are written to temporary files and
 * passed as paths, so the only things the shell ever sees are a validated
 * domain and two paths we generated ourselves.
 */
const IS_WINDOWS = process.platform === 'win32';
const CLI = IS_WINDOWS ? 'shopify.cmd' : 'shopify';

/**
 * `store execute` needs an app authorised against the store first. These are
 * the scopes the operations in this script actually use -- the list comes from
 * validating them against the Admin schema, not from guessing.
 */
const SCOPES = [
  'read_locations',
  'read_inventory',
  'read_publications',
  'write_publications',
  // Required by the `publications` query. Without it the Online Store channel
  // comes back empty and nothing gets published to the storefront.
  'read_markets_home',
  'read_products',
  'write_products',
  'read_content',
  'write_content',
  'read_online_store_pages',
  'write_online_store_pages',
  // The maker metaobject. These four are why an existing install has to run
  // `--auth` again after upgrading: the stored grant does not widen itself.
  'read_metaobject_definitions',
  'write_metaobject_definitions',
  'read_metaobjects',
  'write_metaobjects',
].join(',');

/**
 * Runs the authorisation flow itself rather than printing a command to copy.
 * The scope list is long enough that a wrapped copy-paste silently corrupts it,
 * and the resulting error names an argument that was never typed.
 *
 * The flow opens a browser and waits, so stdio is inherited.
 */
function authorise(store) {
  return new Promise((resolve, reject) => {
    const argv = ['store', 'auth', '--store', store, '--scopes', SCOPES];
    const child = spawn(CLI, IS_WINDOWS ? argv.map((a) => `"${a}"`) : argv, {
      shell: IS_WINDOWS,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`Authorisation exited with code ${code}.`))
    );
  });
}

/* -------------------------------------------------------------------------
   Arguments
   ------------------------------------------------------------------------- */

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const DRY_RUN = has('dry-run');
const ONLY = flag('only');

/**
 * A bare handle is accepted and completed, because that is what people type.
 *
 * The result is validated strictly rather than trusted: on Windows this value
 * reaches a shell, so anything outside the shape of a myshopify domain is
 * refused rather than escaped.
 */
function normaliseStore(value) {
  if (!value) return null;
  const domain = value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const full = domain.includes('.') ? domain : `${domain}.myshopify.com`;
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(full) ? full : false;
}

const STORE = normaliseStore(flag('store'));

if (STORE === false) {
  console.error(
    `\nNot a store domain: ${flag('store')}\n` +
      'Expected something like  my-shop.myshopify.com  (or just  my-shop ).\n' +
      'Find it with:  shopify store list\n'
  );
  process.exit(1);
}

if (!STORE || has('help')) {
  console.log(`
Seeds a development store with the Aurelia test catalogue.

  --store <domain>   Required. your-store.myshopify.com
  --only <step>      metafields | products | collections | blog | pages
  --auth             Authorise this store for Admin API access, then exit
  --check            Report what exists and what is published, then exit
  --dry-run          Print what would run, change nothing
  --help             This message

Run --auth once per store before the first seed.
`);
  process.exit(STORE ? 0 : 1);
}

/* -------------------------------------------------------------------------
   Plumbing
   ------------------------------------------------------------------------- */

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

let created = 0;
let skipped = 0;
const problems = [];

/**
 * Runs one GraphQL operation and returns `data`.
 *
 * `shopify store execute` exits non-zero on transport failures but returns 200
 * with a `userErrors` array for anything the API refused, so both have to be
 * checked. `userErrors` is collected rather than thrown: one product failing
 * should not abandon the other seven.
 */
async function gql(query, variables = {}, { label = '', tolerate = [] } = {}) {
  if (DRY_RUN) {
    console.log(dim(`  would run ${label || query.trim().split('\n')[0]}`));
    return {};
  }

  const dir = mkdtempSync(join(tmpdir(), 'aurelia-seed-'));
  const queryPath = join(dir, 'operation.graphql');
  writeFileSync(queryPath, query, 'utf8');

  const argv = ['store', 'execute', '--store', STORE, '--allow-mutations', '--json'];
  argv.push('--query-file', queryPath);

  if (Object.keys(variables).length > 0) {
    const variablesPath = join(dir, 'variables.json');
    writeFileSync(variablesPath, JSON.stringify(variables), 'utf8');
    argv.push('--variable-file', variablesPath);
  }

  let stdout;
  try {
    // Under a shell, args are joined with spaces, so a temp path containing a
    // space would split into two arguments. Quoting is safe here because both
    // the domain and the paths are known not to contain a quote character.
    const spawnArgs = IS_WINDOWS ? argv.map((a) => `"${a}"`) : argv;
    ({ stdout } = await exec(CLI, spawnArgs, {
      shell: IS_WINDOWS,
      maxBuffer: 32 * 1024 * 1024,
    }));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Could not find the Shopify CLI on PATH (looked for "${CLI}").\n` +
          'Install it with:  npm install -g @shopify/cli\n' +
          'If it is installed already, open a new terminal so PATH is picked up.'
      );
    }

    const detail = String(error.stderr || error.stdout || error.message);
    if (/No stored app authentication|not authenticated|authoriz/i.test(detail)) {
      throw new Error(
        'This store has not been authorised for Admin API access yet.\n\n' +
          'Run this, which opens a browser and does it for you:\n\n' +
          `  node scripts/seed.mjs --store ${STORE} --auth\n`
      );
    }

    throw new Error(`CLI failed for ${label}\n${detail}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  // The CLI prints progress lines before the JSON body on some platforms.
  const start = stdout.indexOf('{');
  if (start === -1) throw new Error(`No JSON in response for ${label}:\n${stdout}`);

  let body;
  try {
    body = JSON.parse(stdout.slice(start));
  } catch {
    throw new Error(`Unparseable response for ${label}:\n${stdout}`);
  }

  if (body.errors) {
    throw new Error(`GraphQL error for ${label}: ${JSON.stringify(body.errors)}`);
  }

  const data = body.data ?? body;
  for (const result of Object.values(data)) {
    const errors = result?.userErrors;
    if (!Array.isArray(errors) || errors.length === 0) continue;

    const fatal = errors.filter((e) => !tolerate.includes(e.code));
    if (fatal.length === 0) {
      skipped += 1;
      console.log(yellow(`  exists  ${label}`));
      // Non-enumerable so the userErrors scan above never sees it.
      Object.defineProperty(data, '__skipped', { value: true });
      return data;
    }
    problems.push({ label, errors: fatal });
    console.log(red(`  failed  ${label}`));
    for (const e of fatal) console.log(red(`          ${e.code || ''} ${e.message}`));
    return data;
  }

  return data;
}

const step = (name) => !ONLY || ONLY === name;


/**
 * Finds the Online Store publication without depending on its name.
 *
 * The channel is named in the merchant's language -- "Loja virtual" on a
 * Portuguese store -- so matching the English string silently fails and every
 * product ends up unpublished. `supportsFuturePublishing` is true only for the
 * online store channel, and it is the same in every language.
 */
function findOnlineStore(nodes = []) {
  return (
    nodes.find((p) => p.supportsFuturePublishing) ??
    nodes.find((p) => p.name === 'Online Store') ??
    null
  );
}

/* -------------------------------------------------------------------------
   Store context
   ------------------------------------------------------------------------- */

async function storeContext() {
  const data = await gql(
    `query SeedContext {
      shop { name currencyCode }
      locations(first: 1, query: "active:true") { nodes { id name } }
      publications(first: 25) { nodes { id name supportsFuturePublishing } }
    }`,
    {},
    { label: 'store context' }
  );

  if (DRY_RUN) return { locationId: 'gid://dry-run/Location/1', publicationId: null };

  const location = data.locations?.nodes?.[0];
  if (!location) throw new Error('No active location on this store.');

  const onlineStore = findOnlineStore(data.publications?.nodes);
  if (!onlineStore) {
    console.log(
      yellow('  Online Store sales channel not found. Products will be created but not published,') +
        yellow('\n  so they will not appear on the storefront. Add the Online Store channel in the') +
        yellow('\n  admin (Sales channels), then re-run this script to publish them.')
    );
  }

  console.log(dim(`  ${data.shop.name} · ${data.shop.currencyCode} · ${location.name}`));
  return { locationId: location.id, publicationId: onlineStore?.id ?? null };
}

/* -------------------------------------------------------------------------
   Metafield definitions
   ------------------------------------------------------------------------- */

async function seedMetaobjectDefinitions() {
  console.log('\nMetaobject definitions');
  const ids = {};

  for (const def of METAOBJECT_DEFINITIONS) {
    // Created definitions are not returned by a create that fails as TAKEN, so
    // the lookup comes first and the id is what the rest of the run needs.
    const existing = await gql(
      `query DefinitionByType($type: String!) {
        metaobjectDefinitionByType(type: $type) { id }
      }`,
      { type: def.type },
      { label: `metaobject ${def.type}` }
    );

    if (existing.metaobjectDefinitionByType?.id) {
      ids[def.type] = existing.metaobjectDefinitionByType.id;
      skipped += 1;
      console.log(dim(`  exists  ${def.type}`));
      continue;
    }

    const result = await gql(
      `mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition { id type }
          userErrors { code field message }
        }
      }`,
      {
        definition: {
          type: def.type,
          name: def.name,
          displayNameKey: def.displayNameKey,
          access: { storefront: 'PUBLIC_READ' },
          capabilities: {
            publishable: { enabled: true },
            // Without this there is no URL, and templates/metaobject/maker.json
            // is a file nothing ever renders.
            onlineStore: {
              enabled: true,
              data: { urlHandle: def.urlHandle, createRedirects: true },
            },
          },
          fieldDefinitions: def.fields.map((field) => ({
            key: field.key,
            name: field.name,
            type: field.type,
            required: field.required === true,
          })),
        },
      },
      { label: `metaobject ${def.type}`, tolerate: ['TAKEN'] }
    );

    if (result.__skipped) continue;
    const id = result.metaobjectDefinitionCreate?.metaobjectDefinition?.id;
    if (id) ids[def.type] = id;
    if (!DRY_RUN) console.log(green(`  ok      ${def.type}`));
    created += 1;
  }

  return ids;
}

async function seedMakers() {
  console.log('\nMakers');
  const ids = {};

  for (const entry of MAKERS) {
    const result = await gql(
      `mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
          metaobject { id handle }
          userErrors { code field message }
        }
      }`,
      {
        handle: { type: entry.type, handle: entry.handle },
        metaobject: {
          capabilities: { publishable: { status: 'ACTIVE' } },
          fields: Object.entries(entry.fields).map(([key, value]) => ({ key, value })),
        },
      },
      { label: entry.fields.name }
    );

    if (result.__skipped) continue;
    const id = result.metaobjectUpsert?.metaobject?.id;
    if (id) ids[entry.handle] = id;
    if (!DRY_RUN) console.log(green(`  ok      ${entry.fields.name}`));
    created += 1;
  }

  return ids;
}

/**
 * Falls back to a lookup when `--only` skipped the step that would have
 * produced these, so `--only products` still writes a usable maker reference.
 */
async function findMakerIds() {
  const ids = {};
  if (DRY_RUN) return ids;

  for (const entry of MAKERS) {
    const data = await gql(
      `query MetaobjectByHandle($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) { id }
      }`,
      { handle: { type: entry.type, handle: entry.handle } },
      { label: `maker ${entry.handle}` }
    );
    if (data.metaobjectByHandle?.id) ids[entry.handle] = data.metaobjectByHandle.id;
  }

  return ids;
}

async function seedMetafieldDefinitions(metaobjectIds = {}) {
  console.log('\nMetafield definitions');

  for (const def of METAFIELD_DEFINITIONS) {
    if (def.metaobjectType && !metaobjectIds[def.metaobjectType] && !DRY_RUN) {
      console.log(dim(`  skip    custom.${def.key} — no ${def.metaobjectType} definition`));
      skipped += 1;
      continue;
    }

    const result = await gql(
      `mutation CreateDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { id key }
          userErrors { code field message }
        }
      }`,
      {
        definition: {
          name: def.name,
          namespace: 'custom',
          key: def.key,
          description: def.description,
          type: def.type,
          ownerType: 'PRODUCT',
          // A metaobject_reference without this validation is rejected: the
          // field has to say which definition it may point at.
          ...(def.metaobjectType && metaobjectIds[def.metaobjectType]
            ? {
                validations: [
                  {
                    name: 'metaobject_definition_id',
                    value: metaobjectIds[def.metaobjectType],
                  },
                ],
              }
            : {}),
          // Without PUBLIC_READ the value exists but Liquid cannot see it, and
          // every ledger row silently falls back.
          access: { storefront: 'PUBLIC_READ' },
        },
      },
      { label: `custom.${def.key}`, tolerate: ['TAKEN'] }
    );
    if (result.__skipped) continue;
    if (!DRY_RUN) console.log(green(`  ok      custom.${def.key}`));
    created += 1;
  }
}

/* -------------------------------------------------------------------------
   Products
   ------------------------------------------------------------------------- */

async function findByHandle(type, handle) {
  if (DRY_RUN) return null;
  const field = { product: 'productByIdentifier', collection: 'collectionByIdentifier' }[type];
  const data = await gql(
    `query Find($handle: String!) {
      ${field}(identifier: { handle: $handle }) { id }
    }`,
    { handle },
    { label: `look up ${type} ${handle}` }
  );
  return data[field]?.id ?? null;
}

async function seedProducts({ locationId, publicationId, makerIds = {} }) {
  console.log('\nProducts');
  const ids = {};

  for (const product of PRODUCTS) {
    const existing = await findByHandle('product', product.handle);

    // productSet rejects a variant whose options are not declared, so a
    // single-variant product gets Shopify's own default option rather than an
    // empty list.
    const hasOptions = product.options.length > 0;
    const options = hasOptions
      ? product.options
      : [{ name: 'Title', values: ['Default Title'] }];

    const input = {
      ...(existing ? { id: existing } : {}),
      handle: product.handle,
      title: product.title,
      descriptionHtml: product.description,
      productType: product.type,
      vendor: product.vendor,
      tags: product.tags,
      status: 'ACTIVE',
      productOptions: options.map((o) => ({
        name: o.name,
        values: o.values.map((v) => ({ name: v })),
      })),
      ...(product.templateSuffix ? { templateSuffix: product.templateSuffix } : {}),
      // The type comes from the definition list rather than from a guess about
      // the key, so adding a metafield of any new type is a one-line change in
      // seed-data.mjs.
      metafields: Object.entries(product.metafields)
        .map(([key, value]) => {
          const definition = METAFIELD_DEFINITIONS.find((entry) => entry.key === key);
          // A reference metafield stores the target's id. seed-data.mjs holds
          // the readable handle, so an unresolved one is dropped rather than
          // written as a string the API would reject.
          const resolved = definition?.metaobjectType ? makerIds[value] : value;
          if (!resolved) return null;
          return {
            namespace: 'custom',
            key,
            value: resolved,
            type: definition?.type ?? 'single_line_text_field',
          };
        })
        .filter(Boolean),
      variants: product.variants.map((variant) => ({
        optionValues: hasOptions
          ? Object.entries(variant.options).map(([optionName, name]) => ({ optionName, name }))
          : [{ optionName: 'Title', name: 'Default Title' }],
        price: variant.price,
        ...(variant.compareAtPrice ? { compareAtPrice: variant.compareAtPrice } : {}),
        ...(variant.sku ? { sku: variant.sku } : {}),
        // Tracked with a DENY policy is what makes a zero-quantity variant read
        // as sold out rather than as available-to-oversell.
        inventoryPolicy: 'DENY',
        inventoryItem: { tracked: true },
        inventoryQuantities: [{ locationId, name: 'available', quantity: variant.quantity }],
      })),
    };

    const data = await gql(
      `mutation SetProduct($input: ProductSetInput!) {
        productSet(synchronous: true, input: $input) {
          product { id handle }
          userErrors { code field message }
        }
      }`,
      { input },
      { label: product.title }
    );

    const id = data.productSet?.product?.id;
    if (id) {
      ids[product.handle] = id;
      console.log(green(`  ok      ${product.title}`) + dim(`  — ${product.exercises}`));
      created += 1;

      if (publicationId) {
        await gql(
          `mutation Publish($id: ID!, $input: [PublicationInput!]!) {
            publishablePublish(id: $id, input: $input) {
              userErrors { field message }
            }
          }`,
          { id, input: [{ publicationId }] },
          { label: `publish ${product.title}` }
        );
      }
    }
  }

  return ids;
}

/* -------------------------------------------------------------------------
   Collections
   ------------------------------------------------------------------------- */

async function seedCollections(productIds, { publicationId }) {
  console.log('\nCollections');

  for (const collection of COLLECTIONS) {
    const existing = await findByHandle('collection', collection.handle);
    const products = collection.productHandles.map((h) => productIds[h]).filter(Boolean);

    // Neither CollectionCreateInput nor CollectionUpdateInput accepts a
    // product list; membership is a separate mutation.
    const data = existing
      ? await gql(
          `mutation UpdateCollection($collection: CollectionUpdateInput!) {
            collectionUpdate(collection: $collection) {
              collection { id handle }
              userErrors { field message }
            }
          }`,
          {
            collection: {
              id: existing,
              title: collection.title,
              descriptionHtml: collection.description,
            },
          },
          { label: collection.title }
        )
      : await gql(
          `mutation CreateCollection($collection: CollectionCreateInput!) {
            collectionCreate(collection: $collection) {
              collection { id handle }
              userErrors { field message }
            }
          }`,
          {
            collection: {
              handle: collection.handle,
              title: collection.title,
              descriptionHtml: collection.description,
            },
          },
          { label: collection.title }
        );

    const id = (data.collectionUpdate ?? data.collectionCreate)?.collection?.id;
    if (!id) continue;

    if (products.length > 0) {
      // `collectionAddProducts` is marked deprecated in favour of
      // `collectionUpdate` with a nested `sources.inclusion.selectionsToAdd`.
      // This stays on the simple call deliberately: it is validated and works,
      // and this is a seed script for a development store, not shipped theme
      // code where the deprecation would matter.
      await gql(
        `mutation AddToCollection($id: ID!, $productIds: [ID!]!) {
          collectionAddProducts(id: $id, productIds: $productIds) {
            collection { id }
            userErrors { field message }
          }
        }`,
        { id, productIds: products },
        { label: `${collection.title}: products` }
      );
    }

    console.log(green(`  ok      ${collection.title}`) + dim(`  ${products.length} pieces`));
    created += 1;

    if (publicationId) {
      await gql(
        `mutation Publish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) { userErrors { field message } }
        }`,
        { id, input: [{ publicationId }] },
        { label: `publish ${collection.title}` }
      );
    }
  }
}

/* -------------------------------------------------------------------------
   Blog and articles
   ------------------------------------------------------------------------- */

async function seedBlog() {
  console.log('\nJournal');

  const existing = DRY_RUN
    ? null
    : (
        await gql(
          `query FindBlog($query: String!) {
            blogs(first: 1, query: $query) { nodes { id handle } }
          }`,
          { query: `handle:${BLOG.handle}` },
          { label: 'look up blog' }
        )
      ).blogs?.nodes?.[0]?.id;

  let blogId = existing;

  if (!blogId) {
    const data = await gql(
      `mutation CreateBlog($blog: BlogCreateInput!) {
        blogCreate(blog: $blog) {
          blog { id handle }
          userErrors { code field message }
        }
      }`,
      { blog: { title: BLOG.title, handle: BLOG.handle, commentPolicy: 'AUTO_PUBLISHED' } },
      { label: BLOG.title }
    );
    blogId = data.blogCreate?.blog?.id;
    if (blogId) {
      console.log(green(`  ok      blog: ${BLOG.title}`));
      created += 1;
    }
  } else {
    console.log(yellow(`  exists  blog: ${BLOG.title}`));
  }

  if (!blogId && !DRY_RUN) return;

  // Dated backwards so the newest article is the lead one on the index.
  const now = Date.now();

  for (const [index, article] of BLOG.articles.entries()) {
    const publishedAt = new Date(now - index * 12 * 24 * 60 * 60 * 1000).toISOString();

    const result = await gql(
      `mutation CreateArticle($article: ArticleCreateInput!) {
        articleCreate(article: $article) {
          article { id handle }
          userErrors { code field message }
        }
      }`,
      {
        article: {
          blogId,
          title: article.title,
          handle: article.handle,
          author: { name: article.author },
          body: article.body,
          summary: article.summary,
          tags: article.tags,
          isPublished: true,
          publishDate: publishedAt,
        },
      },
      { label: article.title, tolerate: ['TAKEN'] }
    );
    if (result.__skipped) continue;
    if (!DRY_RUN) console.log(green(`  ok      ${article.title}`));
    created += 1;
  }
}

/* -------------------------------------------------------------------------
   Pages
   ------------------------------------------------------------------------- */

async function seedPages() {
  console.log('\nPages');

  for (const page of PAGES) {
    const result = await gql(
      `mutation CreatePage($page: PageCreateInput!) {
        pageCreate(page: $page) {
          page { id handle }
          userErrors { code field message }
        }
      }`,
      {
        page: {
          title: page.title,
          handle: page.handle,
          body: page.body,
          isPublished: true,
          ...(page.templateSuffix ? { templateSuffix: page.templateSuffix } : {}),
        },
      },
      { label: page.title, tolerate: ['TAKEN'] }
    );
    if (result.__skipped) continue;
    if (!DRY_RUN) {
      const note = page.templateSuffix ? dim(`  template: page.${page.templateSuffix}`) : '';
      console.log(green(`  ok      ${page.title}`) + note);
    }
    created += 1;
  }
}


/* -------------------------------------------------------------------------
   Diagnosis
   ------------------------------------------------------------------------- */

/**
 * Answers the only question that matters when the admin has data but the
 * storefront shows none: is each record published to the Online Store channel?
 *
 * A product can exist, be ACTIVE, have stock, and still be invisible, because
 * publication is a separate thing from existence.
 */
async function diagnose() {
  console.log(`\nChecking ${STORE}\n`);

  const data = await gql(
    `query Doctor {
      publications(first: 25) { nodes { id name supportsFuturePublishing } }
      products(first: 50, query: "vendor:Aurelia") {
        nodes {
          handle
          title
          status
          totalInventory
          resourcePublications(first: 10) { nodes { isPublished publication { id } } }
        }
      }
      collections(first: 25) {
        nodes {
          handle
          title
          productsCount { count }
          resourcePublications(first: 10) { nodes { isPublished publication { id } } }
        }
      }
      blogs(first: 10) { nodes { handle title } }
      pages(first: 25) { nodes { handle title templateSuffix } }
    }`,
    {},
    { label: 'diagnosis' }
  );

  const channels = data.publications?.nodes ?? [];
  const online = findOnlineStore(channels);

  console.log('Sales channels');
  for (const c of channels) {
    console.log(`  ${c.name}${c.supportsFuturePublishing ? green('  <- the storefront') : ''}`);
  }
  if (!online) {
    console.log(red('\n  The Online Store channel is missing from this store.'));
    console.log(red('  Nothing can appear on a storefront until it is added in the admin.'));
    return;
  }

  // Compared by id, not by name, for the same reason.
  const onStorefront = (node) =>
    (node.resourcePublications?.nodes ?? []).some(
      (rp) => rp.isPublished && rp.publication?.id === online.id
    );

  const seeded = new Set(PRODUCTS.map((p) => p.handle));
  const products = (data.products?.nodes ?? []).filter((p) => seeded.has(p.handle));
  const unpublished = products.filter((p) => !onStorefront(p));
  const draft = products.filter((p) => p.status !== 'ACTIVE');

  console.log(`\nProducts  ${products.length} of ${PRODUCTS.length} found`);
  for (const p of products) {
    const marks = [
      onStorefront(p) ? `on ${online.name}` : red('NOT published'),
      p.status === 'ACTIVE' ? null : red(p.status),
      `${p.totalInventory} in stock`,
    ].filter(Boolean);
    console.log(`  ${p.title.padEnd(18)} ${marks.join(' · ')}`);
  }

  const collections = data.collections?.nodes ?? [];
  console.log('\nCollections');
  for (const c of collections) {
    const marks = [
      onStorefront(c) ? `on ${online.name}` : red('NOT published'),
      `${c.productsCount?.count ?? 0} products`,
    ];
    console.log(`  ${c.title.padEnd(18)} ${marks.join(' · ')}`);
  }

  console.log('\nBlogs');
  for (const b of data.blogs?.nodes ?? []) console.log(`  ${b.title} (${b.handle})`);

  console.log('\nPages');
  for (const pg of data.pages?.nodes ?? []) {
    console.log(`  ${pg.title}${pg.templateSuffix ? dim(`  template: page.${pg.templateSuffix}`) : ''}`);
  }

  console.log('\n---');
  if (unpublished.length > 0 || draft.length > 0) {
    console.log(red(`${unpublished.length} products are not on the ${online.name} channel.`));
    console.log('Fix them all at once:\n');
    console.log(`  node scripts/seed.mjs --store ${STORE} --only products\n`);
  } else if (products.length < PRODUCTS.length) {
    console.log(red('Some products were never created. Re-run the seed.'));
  } else {
    console.log(green('Everything is published.'));
    console.log('If the home page still looks empty, the sections have no source chosen:');
    console.log('  theme editor > Home > Featured collection > pick "Autumn chapter"');
    console.log('  theme editor > Home > Journal > pick "Journal"');
  }
}

/* -------------------------------------------------------------------------
   Run
   ------------------------------------------------------------------------- */

async function main() {
  if (has('auth')) {
    console.log(`\nAuthorising ${STORE}\n`);
    await authorise(STORE);
    console.log(green(`\nAuthorised. Now run:\n\n  node scripts/seed.mjs --store ${STORE}\n`));
    return;
  }

  if (has('check')) {
    await diagnose();
    return;
  }

  console.log(`\nSeeding ${STORE}${DRY_RUN ? dim(' (dry run)') : ''}`);

  const context = await storeContext();

  let metaobjectIds = {};
  let makerIds = {};
  if (step('metaobjects')) {
    metaobjectIds = await seedMetaobjectDefinitions();
    makerIds = await seedMakers();
  }

  // The maker metafield validates against the definition created above, so the
  // metaobject step has to have run -- or its ids be looked up -- first.
  if (step('metafields')) {
    if (Object.keys(metaobjectIds).length === 0 && !DRY_RUN) {
      for (const def of METAOBJECT_DEFINITIONS) {
        const data = await gql(
          `query DefinitionByType($type: String!) {
            metaobjectDefinitionByType(type: $type) { id }
          }`,
          { type: def.type },
          { label: `metaobject ${def.type}` }
        );
        if (data.metaobjectDefinitionByType?.id) {
          metaobjectIds[def.type] = data.metaobjectDefinitionByType.id;
        }
      }
    }
    await seedMetafieldDefinitions(metaobjectIds);
  }

  let productIds = {};
  if (step('products')) {
    if (Object.keys(makerIds).length === 0) makerIds = await findMakerIds();
    productIds = await seedProducts({ ...context, makerIds });
  }
  if (step('collections')) {
    if (Object.keys(productIds).length === 0 && !DRY_RUN) {
      for (const p of PRODUCTS) {
        const id = await findByHandle('product', p.handle);
        if (id) productIds[p.handle] = id;
      }
    }
    await seedCollections(productIds, context);
  }
  if (step('blog')) await seedBlog();
  if (step('pages')) await seedPages();

  if (!DRY_RUN) console.log(`\n${created} written, ${skipped} already existed`);

  if (problems.length > 0) {
    console.log(red(`\n${problems.length} failed:`));
    for (const p of problems) console.log(red(`  ${p.label}`));
    process.exitCode = 1;
    return;
  }

  console.log(`
Next, in the admin — two things the API will not do for you:

  1. Swatches. Products > The Signet > Options > Metal > add a swatch colour to
     each value. The theme shows the dot beside the name; without this it shows
     the name alone, which still reads correctly.

  2. Navigation. Content > Menus. The store's default main menu still points at
     whatever was there before; add Autumn chapter and Rings to it, and the two
     new pages to the footer menu.

  3. Sections. In the theme editor, open the home page and choose the collection
     on "Featured collection" and the blog on "Journal". The theme ships without
     those set on purpose -- the Theme Store rejects templates that name a
     specific store's resources.

Then: shopify theme dev --store ${STORE}
`);
}

main().catch((error) => {
  console.error(red(`\n${error.message}`));
  process.exit(1);
});
