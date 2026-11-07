// Copies site/results.json from spangloss/spangloss into src/data/results.json.
// That file is generated from the stored labels and gold (python -m
// spangloss.resultsgen), with a lead approved by the owner; /results/ is rendered
// from it.
//
// Usage:
//   node scripts/sync-results.mjs [ref]          copy from a branch, tag or commit (default: main)
//   node scripts/sync-results.mjs --check [ref]  exit 1 if the local copy differs
import { syncFile } from './lib/sync-file.mjs';

await syncFile('results.json');
