// Copies one generated file from spangloss/spangloss's site/ into src/data/.
// Shared by sync-labels.mjs and sync-results.mjs.
//
// Arguments: [--check] [ref]   ref is a branch, tag or commit (default: main);
// --check exits 1 if the local copy differs instead of writing it.
import { readFile, writeFile } from 'node:fs/promises';

export async function syncFile(name, argv = process.argv.slice(2)) {
  const check = argv.includes('--check');
  const ref = argv.find((a) => !a.startsWith('--')) ?? 'main';
  const url = `https://raw.githubusercontent.com/spangloss/spangloss/${ref}/site/${name}`;
  const local = new URL(`../../src/data/${name}`, import.meta.url);

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
      console.error(`src/data/${name} differs from spangloss/spangloss@${ref}. Run: node scripts/sync-${name.replace(/\.json$/, '')}.mjs ${ref}`);
      process.exit(1);
    }
    console.log(`src/data/${name} matches spangloss/spangloss@${ref}`);
  } else {
    await writeFile(local, remote);
    console.log(`Wrote src/data/${name} from spangloss/spangloss@${ref}`);
  }
}
