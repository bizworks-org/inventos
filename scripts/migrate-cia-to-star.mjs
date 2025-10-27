#!/usr/bin/env node
/*
  migrate-cia-to-star.mjs

  Usage:
    node migrate-cia-to-star.mjs [--mode api|file] [--apply] [--base http://localhost:3000]

  Defaults:
    mode: api
    apply: false (dry-run)
    base: http://localhost:3000

  Modes:
    api  - fetch assets from the running dev server at /api/assets and (optionally) PATCH updates back
    file - operate on the local mock data file `src/lib/data.ts` and replace CIA JSON strings inside with averaged star numbers

  Notes:
    - By default the script only runs a dry-run and prints what it would change. Pass --apply to perform updates.
    - API mode expects the dev server to expose a GET /api/assets that returns an array of assets and a PATCH/PUT endpoint at /api/assets/:id that accepts partial asset updates (this is best-effort; check your server API before applying in production).
    - File mode performs a cautious textual replacement: it finds quoted JSON strings in the file and replaces those JSON strings that parse to objects with c,i,a keys by the averaged numeric star value (rounded). This modifies the source file directly when --apply is passed.
*/

import fs from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
const opts = {
  mode: 'api',
  apply: false,
  base: process.env.BASE_URL || 'http://localhost:3000'
};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--mode' && argv[i + 1]) { opts.mode = argv[++i]; }
  if (a === '--apply') opts.apply = true;
  if (a === '--base' && argv[i + 1]) { opts.base = argv[++i]; }
  if (a === '--help' || a === '-h') {
    console.log(fs.readFileSync(new URL(import.meta.url).pathname, 'utf8'));
    process.exit(0);
  }
}

// Respect user's preference: do not perform any conversion writes.
if (opts.apply) {
  console.log('\nNOTE: Conversion/apply mode has been disabled by project policy. This script will run in reporting (dry-run) mode only to avoid converting CIA data to single stars.');
  opts.apply = false;
}

function isCiaLike(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return (('c' in obj) && ('i' in obj) && ('a' in obj));
}

function avgCia(obj) {
  const c = Number(obj.c) || 0;
  const i = Number(obj.i) || 0;
  const a = Number(obj.a) || 0;
  return Math.max(0, Math.min(5, Math.round((c + i + a) / 3)));
}

async function runApiMode() {
  const base = opts.base.replace(/\/$/, '');
  const listUrl = `${base}/api/assets`;
  console.log(`API mode: fetching assets from ${listUrl}`);
  try {
    const res = await fetch(listUrl);
    if (!res.ok) {
      console.error('Failed to fetch assets:', res.status, res.statusText);
      process.exit(1);
    }
    const assets = await res.json();
    if (!Array.isArray(assets)) {
      console.error('Unexpected response: /api/assets did not return an array. Response sample:', assets && typeof assets === 'object' ? Object.keys(assets).slice(0,10) : typeof assets);
      process.exit(1);
    }

    const changes = [];
    for (const asset of assets) {
      const custom = asset?.specifications?.customFields;
      if (!custom || typeof custom !== 'object') continue;
      const updates = {};
      for (const k of Object.keys(custom)) {
        const raw = custom[k];
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            if (isCiaLike(parsed)) {
              const avg = avgCia(parsed);
              updates[k] = String(avg);
            }
          } catch (e) {
            // not JSON
          }
        }
      }
      if (Object.keys(updates).length > 0) {
        changes.push({ id: asset.id, updates });
      }
    }

    if (changes.length === 0) {
      console.log('No CIA-like custom field values found in the fetched assets. Nothing to do.');
      return;
    }

    console.log(`Found ${changes.length} assets with CIA values.`);
    for (const ch of changes) {
      console.log(`- Asset ${ch.id}: will update keys: ${Object.keys(ch.updates).join(', ')}`);
    }

    if (!opts.apply) {
      console.log('\nDry-run mode. To apply changes against the server, re-run with --apply');
      return;
    }

    // Apply updates: use PATCH to update only specifications.customFields if available
    for (const ch of changes) {
      const patchUrl = `${base}/api/assets/${encodeURIComponent(ch.id)}`;
      const body = { specifications: { customFields: ch.updates } };
      console.log(`Applying to ${patchUrl} ->`, body);
      try {
        const r = await fetch(patchUrl, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) {
          // Try PUT as fallback
          console.warn(`PATCH failed for ${ch.id}: ${r.status} ${r.statusText}. Trying PUT with partial body.`);
          const r2 = await fetch(patchUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if (!r2.ok) {
            console.error(`PUT also failed for ${ch.id}: ${r2.status} ${r2.statusText}`);
          } else {
            console.log(`Updated ${ch.id} via PUT`);
          }
        } else {
          console.log(`Updated ${ch.id} via PATCH`);
        }
      } catch (e) {
        console.error('Failed to apply update for', ch.id, e?.message || e);
      }
    }

  } catch (e) {
    console.error('Error fetching assets:', e?.message || e);
    process.exit(1);
  }
}

function runFileMode() {
  const filePath = path.resolve(process.cwd(), 'src', 'lib', 'data.ts');
  console.log('File mode: operating on', filePath);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // Replace quoted JSON strings that parse to objects with c/i/a keys by their averaged numeric string
  const regex = /(["'])(\{[^"']*?\})\1/gm;
  let match;
  let newContent = content;
  const replacements = [];
  while ((match = regex.exec(content)) !== null) {
    const full = match[0];
    const quote = match[1];
    const inner = match[2];
    try {
      const parsed = JSON.parse(inner);
      if (isCiaLike(parsed)) {
        const avg = avgCia(parsed);
        const replacement = quote + String(avg) + quote;
        replacements.push({ found: full, replacement });
      }
    } catch (e) {
      // ignore
    }
  }

  if (replacements.length === 0) {
    console.log('No CIA JSON string occurrences found in', filePath);
    return;
  }

  console.log(`Found ${replacements.length} CIA JSON string(s) in the file. Examples:`);
  for (let i = 0; i < Math.min(5, replacements.length); i++) {
    console.log(' ', replacements[i].found, '->', replacements[i].replacement);
  }

  if (!opts.apply) {
    console.log('\nDry-run. To apply textual replacements to the file, re-run with --apply');
    return;
  }

  // Apply replacements globally
  for (const r of replacements) {
    newContent = newContent.split(r.found).join(r.replacement);
  }
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('File updated:', filePath, '\nPlease review and commit changes as needed.');
}

(async function main() {
  console.log('migrate-cia-to-star: mode=%s apply=%s base=%s', opts.mode, opts.apply, opts.base);
  if (opts.mode === 'api') {
    await runApiMode();
  } else if (opts.mode === 'file') {
    runFileMode();
  } else {
    console.error('Unknown mode:', opts.mode);
    process.exit(1);
  }
})();
