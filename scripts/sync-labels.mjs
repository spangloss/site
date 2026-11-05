// Copies site/labels.json from spangloss/spangloss into src/data/labels.json.
// That file is generated from TAXONOMY.md (python -m spangloss.sitegen) and
// approved by the owner; the landing page's labels table is rendered from it.
//
// Usage:
//   node scripts/sync-labels.mjs [ref]          copy from a branch, tag or commit (default: main)
//   node scripts/sync-labels.mjs --check [ref]  exit 1 if the local copy differs
import { readFile, writeFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const check = args.includes('--check');
const ref = args.find((a) => !a.startsWith('--')) ?? 'main';
const url = `https://raw.githubusercontent.com/spangloss/spangloss/${ref}/site/labels.json`;
const local = new URL('../src/data/labels.json', import.meta.url);

const res = await fetch(url);
if (!res.ok) {
  console.error(`Could not fetch ${url}: HTTP ${res.status}`);
  process.exit(2);
}
const remote = await res.text();
JSON.parse(remote); // fail loudly on anything that isn't JSON

if (check) {
  const current = await readFile(local, 'utf8').catch(() => '');
  if (current !== remote) {
    console.error(`src/data/labels.json differs from spangloss/spangloss@${ref}. Run: node scripts/sync-labels.mjs ${ref}`);
    process.exit(1);
  }
  console.log(`src/data/labels.json matches spangloss/spangloss@${ref}`);
} else {
  await writeFile(local, remote);
  console.log(`Wrote src/data/labels.json from spangloss/spangloss@${ref}`);
}
