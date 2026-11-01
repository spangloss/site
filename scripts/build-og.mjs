#!/usr/bin/env node
/**
 * Renders the Open Graph preview images (1200×630 PNG) that LinkedIn, Slack
 * and others show as the link card, into public/og/:
 *
 *   public/og/site.png                 landing page
 *   public/og/notebook.png             Notebook index
 *   public/og/notebook/<entry-id>.png  one per entry
 *
 * Runs with plain Node before `astro build`, so the native resvg binary never
 * goes through Vite or an adapter's runtime bundle. Drafts are skipped unless
 * --drafts is passed (`npm run dev` passes it). public/og/ is emptied first,
 * so draft images from a dev run never reach a production build.
 *
 *   node scripts/build-og.mjs [--drafts]
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { parse as parseYaml } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'public/og');
const notebookDir = join(root, 'src/content/notebook');
const includeDrafts = process.argv.includes('--drafts');

const WIDTH = 1200;
const HEIGHT = 630;

// Same values as the CSS variables in src/styles/global.css. Satori cannot
// read CSS variables, so they are repeated here.
const color = {
  paper: '#ECE4D3',
  ink: '#1F1A14',
  inkSoft: '#3A322A',
  muted: '#5A5045',
  brand: '#C0611F',
  marker: '#E39A6E',
};

function font(pkg, file) {
  return readFileSync(join(root, 'node_modules/@fontsource', pkg, 'files', file));
}

const fonts = [
  { name: 'IM Fell English', data: font('im-fell-english', 'im-fell-english-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'IM Fell English', data: font('im-fell-english', 'im-fell-english-latin-400-italic.woff'), weight: 400, style: 'italic' },
  { name: 'IBM Plex Mono', data: font('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff'), weight: 500, style: 'normal' },
];

const logo =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M14 8 H8 V40 H14 M34 8 H40 V40 H34" fill="none" stroke="${color.ink}" stroke-width="5"/><rect x="15" y="15" width="18" height="8" fill="${color.ink}"/><rect x="15" y="27.5" width="12" height="5" fill="${color.brand}"/></svg>`,
  ).toString('base64');

function h(type, style, ...children) {
  return { type, props: { style, children } };
}

/**
 * kicker: small caps line at the top right, e.g. "NOTEBOOK · NO. 1".
 * highlight: words at the end of the title to set on the marker highlight.
 */
function card({ kicker, title, highlight, subtitle }) {
  const lead = highlight && title.endsWith(highlight) ? title.slice(0, -highlight.length).trimEnd() : title;
  const titleSize = title.length > 48 ? 64 : 76;

  return h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      // Satori defaults to content-box; without this the padding overflows.
      boxSizing: 'border-box',
      padding: '60px 72px 56px',
      backgroundColor: color.paper,
      backgroundImage:
        'radial-gradient(ellipse at 20% 0%, rgba(255,250,235,.7), transparent 60%), radial-gradient(ellipse at 90% 100%, rgba(120,90,50,.14), transparent 55%)',
      color: color.ink,
      fontFamily: 'IM Fell English',
    },
    h(
      'div',
      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 28, borderBottom: `2px solid ${color.ink}` },
      h(
        'div',
        { display: 'flex', alignItems: 'center', gap: 16 },
        { type: 'img', props: { src: logo, width: 52, height: 52 } },
        h('div', { display: 'flex', fontSize: 46, lineHeight: 1 }, 'span', h('span', { color: color.brand }, 'gloss')),
      ),
      h('div', { fontFamily: 'IBM Plex Mono', fontSize: 20, letterSpacing: '0.14em', color: color.muted }, kicker),
    ),
    h(
      'div',
      { display: 'flex', flexDirection: 'column' },
      h(
        'div',
        { display: 'flex', flexWrap: 'wrap', fontSize: titleSize, lineHeight: 1.08 },
        lead,
        ...(highlight && lead !== title
          ? [h('span', { backgroundColor: color.marker, padding: '0 10px', marginLeft: 8 }, highlight)]
          : []),
      ),
      h('div', { marginTop: 24, fontSize: 32, fontStyle: 'italic', lineHeight: 1.35, color: color.inkSoft }, subtitle),
    ),
    h(
      'div',
      { display: 'flex', justifyContent: 'space-between', fontFamily: 'IBM Plex Mono', fontSize: 20, color: color.muted },
      h('span', {}, 'spangloss.ai'),
      h('span', {}, 'span + gloss'),
    ),
  );
}

async function write(path, input) {
  const svg = await satori(card(input), { width: WIDTH, height: HEIGHT, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  const file = join(outDir, path);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, png);
  console.log(`og: public/og/${path}`);
}

/** Frontmatter of each entry. The schema itself is checked by Astro. */
function entries() {
  return readdirSync(notebookDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const text = readFileSync(join(notebookDir, file), 'utf8');
      const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match) throw new Error(`${file}: no frontmatter`);
      // Same id as Astro's glob loader for lowercase-kebab file names.
      return { id: basename(file, '.md'), data: parseYaml(match[1]) };
    })
    .filter((entry) => includeDrafts || entry.data.status === 'published');
}

rmSync(outDir, { recursive: true, force: true });

await write('site.png', {
  kicker: 'SECURITY LABELS FOR AI AGENT TELEMETRY',
  title: 'Your agent’s actions, glossed.',
  highlight: 'glossed.',
  subtitle: 'A short, typed gloss beside every tool call in an agent’s OpenTelemetry trace.',
});

await write('notebook.png', {
  kicker: 'NOTEBOOK',
  title: 'Notebook',
  subtitle: 'Longer write-ups of what building spangloss turns up.',
});

for (const entry of entries()) {
  await write(`notebook/${entry.id}.png`, {
    kicker: `NOTEBOOK · NO. ${entry.data.number}`,
    title: entry.data.title,
    subtitle: entry.data.dek,
  });
}
