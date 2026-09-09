#!/usr/bin/env node
// Applies one preset to the working tree so it can be previewed with
// `shopify theme dev`.
//
// A preset is two halves that must move together. The settings half lives in
// config/settings_data.json under `presets`. The layout half lives in
// listings/<preset>/, which is in .shopifyignore -- Shopify never sees it, so
// switching a preset in the theme editor changes fonts and colours and nothing
// else. This copies the listing files over the real ones.
//
// It overwrites tracked files. `--restore` puts them back with git.

import { readFileSync, writeFileSync, existsSync, cpSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const TOUCHED = ['templates', 'sections', 'config/settings_data.json'];
const arg = process.argv[2];

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const settingsPath = 'config/settings_data.json';
const presets = JSON.parse(readFileSync(settingsPath, 'utf8')).presets;
const names = Object.keys(presets);

if (!arg || arg === '--help') {
  console.log(`Usage: node scripts/preset.mjs <${names.map((n) => n.toLowerCase()).join('|')}>
       node scripts/preset.mjs --restore

Then: shopify theme dev --store <your-store>.myshopify.com`);
  process.exit(0);
}

if (arg === '--restore') {
  git('checkout', '--', ...TOUCHED);
  console.log(`Restored ${TOUCHED.join(', ')} from git.`);
  process.exit(0);
}

const name = names.find((n) => n.toLowerCase() === arg.toLowerCase());
if (!name) {
  console.error(`Unknown preset "${arg}". Known: ${names.join(', ')}`);
  process.exit(1);
}

// Refuse to bury edits that are not ours to overwrite.
const dirty = git('status', '--porcelain', '--', ...TOUCHED).trim();
if (dirty) {
  console.error(`Uncommitted changes in files this would overwrite:\n${dirty}\n
Commit or stash them first, or run --restore if they are from an earlier switch.`);
  process.exit(1);
}

// Settings: merge, never replace. A preset carries 14 of the 19 keys, and the
// five it omits would fall back to schema defaults if we assigned wholesale.
const data = JSON.parse(readFileSync(settingsPath, 'utf8'));
data.current = { ...data.current, ...presets[name] };
writeFileSync(settingsPath, JSON.stringify(data, null, 2) + '\n');

// Layout: whatever the preset overrides, and only that.
const root = join('listings', name.toLowerCase());
const copied = [];
for (const dir of ['templates', 'sections']) {
  const from = join(root, dir);
  if (!existsSync(from)) continue;
  for (const f of readdirSync(from)) {
    cpSync(join(from, f), join(dir, f));
    copied.push(join(dir, f));
  }
}

console.log(`${name} applied.
  settings   ${Object.keys(presets[name]).length} keys merged into current
  files      ${copied.join('\n             ') || 'none'}

  shopify theme dev --store <your-store>.myshopify.com
  node scripts/preset.mjs --restore    # when you are done`);
