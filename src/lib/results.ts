// Types and formatting for src/data/results.json, a copy of site/results.json in
// spangloss/spangloss (python -m spangloss.resultsgen). Numbers are formatted the
// way that repo's docs/results-v0.md formats them, so the two agree to the digit.

export type Ratio = { hits: number; of: number };

export type NotReported = { status: 'not_reported'; see: string };
export type Scored = {
  status: 'scored';
  n: number;
  correct: number;
  accuracy: number | null;
  ci95: [number, number] | null;
  shapes: number;
  shape_accuracy: number | null;
  ece: number | null;
  not_labeled: number;
  precision?: Ratio;
  recall?: Ratio;
};
export type ModelEntry = NotReported | Scored;

export type LabelEntry = { label: string; positive: string | null; gold_n: number; models: Record<string, ModelEntry> };
export type GoldSet = {
  id: string;
  name: string;
  description: string;
  calls: number;
  shapes: number;
  labels: LabelEntry[];
  set_by_rule: { label: string; n: number; agrees_with_gold: number }[];
};
export type InjectionRow = {
  set: string;
  shape: string;
  gold: string;
  n: number;
  models: Record<string, NotReported | { status: 'scored'; labeled: number; yes: number }>;
};
/** Owner-approved text: inline Markdown with `code` spans and [links](url). */
export type TextItem = { head: string; text: string };
export type TextBlock = { status: string; title: string; intro: string; items: TextItem[] };
export type Notices = {
  status: string;
  items: {
    accuracy_chart: string;
    gold_sets_table: string;
    real_sessions_table: string;
    scenarios_table: string;
    set_by_rule_tables: string;
    injection_chart: string;
    data_class_chart: string;
    calibration_chart: string;
  };
};
export type SecretsRow =
  | { set: string; model: string; status: 'not_reported' }
  | { set: string; model: string; status: 'scored'; flagged: number; real: number; test_config: number; other: number };
export type CalibrationBin = {
  lo: number;
  hi: number;
  n: number;
  mean_confidence: number | null;
  accuracy: number | null;
};
export type CalibrationRow = { set: string; model: string; n: number; bins: CalibrationBin[] };

export type Results = {
  schema: string;
  title: string;
  taxonomy: string;
  provenance: { generator: string; generated: string; commit: string; source_clean: boolean };
  small_n: number;
  models: {
    id: string;
    name: string;
    runs: string;
    sec_model: string;
    /** The weights behind the labels; null when they weren't recorded. */
    checkpoint: string | null;
    not_reported: string[];
  }[];
  lead: { status: 'approved' | 'proposed'; text: string };
  how_to_read: TextBlock;
  findings: TextBlock;
  notices: Notices;
  caveats: TextBlock;
  gold_sets: GoldSet[];
  injection_by_shape: InjectionRow[];
  secrets_flagged: SecretsRow[];
  calibration: CalibrationRow[];
  known_limitations: { title: string; see: string }[];
  method: { text: string; see: string[] }[];
};

export const REPO = 'https://github.com/spangloss/spangloss';
export const DAGGER = ' †';

/** A repo path, optionally with #anchor, as a link to the file on GitHub. */
export const repoUrl = (path: string) => `${REPO}/blob/main/${path}`;
/** The file name of a repo path, without its anchor. */
export const fileName = (path: string) => path.split('#')[0].split('/').pop() ?? path;

/** 0.8919 -> "89.2%", like Python's f"{x:.1%}". */
export const pct = (x: number | null, sign = '%') => (x === null ? '—' : `${(x * 100).toFixed(1)}${sign}`);
export const dec = (x: number | null) => (x === null ? '—' : x.toFixed(3));

export const accuracy = (m: Scored) =>
  m.accuracy === null || !m.ci95 ? '—' : `${pct(m.accuracy)} (${pct(m.ci95[0], '')}–${pct(m.ci95[1])})`;

export const ratio = (r: Ratio | undefined, small: number, empty: string) => {
  if (!r) return '—';
  if (!r.of) return `— (${empty})`;
  return `${r.hits}/${r.of} (${pct(r.hits / r.of)})${r.of < small ? DAGGER : ''}`;
};

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Escaped text with `code` spans as <code> and [text](https://…) as links. */
export const inline = (s: string) =>
  escape(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2">$1 ↗</a>');

/** Approved text blocks; the build fails if any isn't approved. */
export function checkApproved(results: Results) {
  const blocks = { lead: results.lead, how_to_read: results.how_to_read, findings: results.findings, notices: results.notices, caveats: results.caveats };
  for (const [name, block] of Object.entries(blocks)) {
    if (block.status !== 'approved') throw new Error(`results.json: ${name} is not approved`);
  }
}

/** A label without its sec. prefix, as the charts show it. */
export const shortLabel = (label: string) => label.replace(/^sec\./, '');

/** Each labeler's chart marker; its color is the --series-<id> variable in global.css. */
export const MARKERS: Record<string, 'square' | 'circle'> = { kev: 'square', jev: 'circle' };
export const marker = (id: string) => {
  const shape = MARKERS[id];
  if (!shape) throw new Error(`results.json: no chart marker for labeler ${id}`);
  return shape;
};
