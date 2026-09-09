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

import {
  readFileSync, writeFileSync, existsSync, cpSync, readdirSync, rmSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

// Whole files this copies over. settings_data.json is deliberately not here:
// only its `current` key is written, so an edit to `presets` -- a palette being
// tuned, say -- is neither a conflict nor something --restore may throw away.
const TOUCHED = ['templates', 'sections'];
const arg = process.argv[2];

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const settingsPath = 'config/settings_data.json';
// Records that a preset is currently applied, so re-applying -- after tuning a
// palette, say -- is one command instead of restore-then-apply. Lives under
// scripts/, which .shopifyignore already keeps out of the store.
const statePath = 'scripts/.preset-applied';
const presets = JSON.parse(readFileSync(settingsPath, 'utf8')).presets;
const names = Object.keys(presets);

if (!arg || arg === '--help') {
  console.log(`Usage: node scripts/preset.mjs <${names.map((n) => n.toLowerCase()).join('|')}>
       node scripts/preset.mjs --restore

Then: shopify theme dev --store <your-store>.myshopify.com`);
  process.exit(0);
}

const headCurrent = () =>
  JSON.parse(execFileSync('git', ['show', `HEAD:${settingsPath}`], { encoding: 'utf8' })).current;

if (arg === '--restore') {
  git('checkout', '--', ...TOUCHED);
  const data = JSON.parse(readFileSync(settingsPath, 'utf8'));
  data.current = headCurrent();
  writeFileSync(settingsPath, JSON.stringify(data, null, 2) + '\n');
  rmSync(statePath, { force: true });
  console.log(`Restored ${TOUCHED.join(', ')} and the "current" settings from git.
Anything you changed under "presets" was left alone.`);
  process.exit(0);
}

const name = names.find((n) => n.toLowerCase() === arg.toLowerCase());
if (!name) {
  console.error(`Unknown preset "${arg}". Known: ${names.join(', ')}`);
  process.exit(1);
}

// Refuse to bury edits that are not ours to overwrite. Two separate questions:
// the files that get copied wholesale, and the one key that gets written.
const dirty = git('status', '--porcelain', '--', ...TOUCHED).trim();
const live = JSON.parse(readFileSync(settingsPath, 'utf8'));
const currentEdited =
  JSON.stringify(live.current) !== JSON.stringify(headCurrent());

// A preset already applied is our own doing, not the user's work: overwrite it.
const applied = existsSync(statePath)
  ? readFileSync(statePath, 'utf8').trim()
  : null;

if (!applied && (dirty || currentEdited)) {
  console.error('Uncommitted changes this would overwrite:');
  if (dirty) console.error(dirty);
  if (currentEdited) console.error(`M  ${settingsPath} ("current" settings)`);
  console.error(`
Commit or stash them, or run --restore if they are from an earlier switch.
Edits under "presets" do not block this and are never overwritten.`);
  process.exit(1);
}

// Settings: merge, never replace. A preset carries 14 of the 19 keys, and the
// five it omits would fall back to schema defaults if we assigned wholesale.
live.current = { ...live.current, ...presets[name] };
writeFileSync(settingsPath, JSON.stringify(live, null, 2) + '\n');

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

writeFileSync(statePath, name + '\n');

console.log(`${name} applied${applied ? `, replacing ${applied}` : ''}.
  settings   ${Object.keys(presets[name]).length} keys merged into current
  files      ${copied.join('\n             ') || 'none'}

  shopify theme dev --store <your-store>.myshopify.com
  node scripts/preset.mjs --restore    # when you are done`);
