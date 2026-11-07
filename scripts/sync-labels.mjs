// Copies site/labels.json from spangloss/spangloss into src/data/labels.json.
// That file is generated from TAXONOMY.md (python -m spangloss.sitegen) and
// approved by the owner; the landing page's labels table is rendered from it.
//
// Usage:
//   node scripts/sync-labels.mjs [ref]          copy from a branch, tag or commit (default: main)
//   node scripts/sync-labels.mjs --check [ref]  exit 1 if the local copy differs
import { syncFile } from './lib/sync-file.mjs';

await syncFile('labels.json');
