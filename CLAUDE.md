# CLAUDE.md

## What this is

The website for spangloss, served at https://spangloss.ai. Spangloss itself (the Python sidecar that adds `sec.*` security labels to AI agent telemetry) lives in the `spangloss/spangloss` repo; this repo is only the site.

The site has two parts:

- **Landing page** (`src/pages/index.astro`): what spangloss is, how it works, the labels, the telemetry findings, how it is evaluated, the Notebook list and project status.
- **Results** (`src/pages/results.astro`, `/results/`): the v0 per-label results, rendered from `src/data/results.json`.
- **Notebook** (`src/pages/notebook/`): longer write-ups, one page per entry, plus an index and an RSS feed. Short versions run on LinkedIn and link back here.

Built with Astro as a fully static site. No server, no client-side framework, no analytics or tracking scripts, and no third-party requests: fonts come from `@fontsource` packages and the asciinema player is bundled from npm.

## Design

The visual spec is in `design/` (`A3.dc.html` for the landing page, `A3Notebook.dc.html` for a Notebook entry). Those files are canvas exports; their `{{grain}}`, `{{marker}}` and `{{accent}}` placeholders and `<x-dc>` wrapper have already been turned into plain HTML and CSS. Match them when changing layout, type or copy.

- Fonts: IM Fell English (display, italics), IBM Plex Sans (body), IBM Plex Mono (labels, nav, data).
- All site colors are CSS variables in `:root` in `src/styles/global.css`. Use the variables; don't add raw hex values in components. The one exception is `scripts/build-og.mjs`, which repeats a few values because satori can't read CSS variables. Keep the two in sync.
- Textures: `.linen` (page), `.leaf` (raised paper), `.crt` (terminal panels), the `#ink` and `#marker` SVG filters, and the grain overlay, all defined in `src/layouts/Base.astro` and `global.css`.

## Layout

```
src/
  data/labels.json         Copy of spangloss/spangloss site/labels.json (scripts/sync-labels.mjs)
  data/results.json        Copy of spangloss/spangloss site/results.json (scripts/sync-results.mjs)
  content.config.ts        Notebook collection schema
  content/notebook/*.md    Published Notebook entries
  content/notebook/_drafts/  Draft entries (git-ignored, local only)
  data/forthcoming.ts      Announced entries not yet published
  layouts/Base.astro       <head>, OG tags, header, footer, textures
  components/              EntryList, AsciinemaPlayer, DemoSlot, Logo
  components/charts/       Results charts: inline SVG drawn at build time
  lib/notebook.ts          getEntries(), getListing() (draft rules), dates
  lib/results.ts           results.json types and number formatting
  pages/
    index.astro            Landing page
    results.astro          Results page
    notebook/index.astro   Notebook index
    notebook/rss.xml.ts    RSS feed
    notebook/[slug]/       Entry page
public/casts/              asciinema recordings (.cast)
public/og/                 Generated OG images (git-ignored)
scripts/build-og.mjs       Renders public/og/ (satori + resvg); fails on a misplaced draft
scripts/sync-*.mjs         Copy generated JSON from spangloss/spangloss (lib/sync-file.mjs)
.githooks/pre-commit       Refuses commits that stage a draft
```

## Adding a Notebook entry

This repo is public, so drafts never enter git. They live in `src/content/notebook/_drafts/`, which `.gitignore` excludes. Two guards back this up:

- `scripts/build-og.mjs` runs before every build, Cloudflare's included, and fails if any file in `src/content/notebook/` outside `_drafts/` has `status: draft`.
- `.githooks/pre-commit` refuses a commit that stages any file under `_drafts/` (for example with `git add -f`), or a notebook file whose staged content has `status: draft`. Enable it once per clone with `git config core.hooksPath .githooks`.

Never commit a draft, move one out of `_drafts/` before it is published, or bypass the hook (`--no-verify`).

1. Create `src/content/notebook/_drafts/NNN-short-slug.md`, lowercase with hyphens. The file name (without `.md`) becomes the URL, `/notebook/NNN-short-slug/`, and the OG image name; the `_drafts/` folder is not part of either.
2. Frontmatter:

   ```yaml
   ---
   number: 3                       # entry number, shown as "No. 3"
   title: A prompt note moves probabilities, not answers
   dek: Why spangloss computes structural facts instead of asking a model for them.
   status: draft                   # draft | published
   date: 2026-11-20                # required when published
   linkedin_url: https://www.linkedin.com/posts/...   # optional; adds the "Short version on LinkedIn" link
   ---
   ```

3. Write the body in plain Markdown. `##` headings, tables, inline code and links are styled by `.prose` in `global.css`. Two special blocks are written as HTML:

   ```html
   <figure class="leaf">
   <blockquote>Quoted excerpt.</blockquote>
   <figcaption>Source of the excerpt.</figcaption>
   </figure>

   <div class="aside leaf">
   <p class="aside__head">Boxed note heading</p>
   <p>Boxed note text, with <a href="https://example.com">links</a>.</p>
   </div>
   ```

4. List the entry in `src/data/forthcoming.ts` (number, title, dek). The draft file never reaches Cloudflare, so this keeps its number in the public lists as FORTHCOMING.
5. Run `npm run dev` and check the entry page, the landing page list and `/og/notebook/<slug>.png` (the LinkedIn card image).
6. To publish: move the file up to `src/content/notebook/`, set `status: published` and a `date`, remove its item from `src/data/forthcoming.ts`, then build and commit.

Drafts show in `npm run dev` (marked DRAFT, with a page). A local `npm run build` still loads `_drafts/`; there a draft has no page, OG image, RSS item or sitemap entry, and lists like a forthcoming entry: number, title, dek and FORTHCOMING, without a link. Cloudflare's build has no `_drafts/` at all, so the `forthcoming.ts` item is what it lists. Lists come from `getListing()` in `src/lib/notebook.ts`, which merges entries and `src/data/forthcoming.ts` by number (a Markdown entry wins) and fails the build if two entries, or two forthcoming items, share a number. Pages and the RSS feed come from `getEntries()`. Use these two; never call `getCollection` directly. `scripts/build-og.mjs` applies the same rule to OG images on its own, since it runs outside Astro.

## Demo recording

`src/components/AsciinemaPlayer.astro` plays a file from `public/casts/`. The landing page has `<DemoSlot />`, which renders nothing until it is given a recording: put the file in `public/casts/` and change it to `<DemoSlot cast="demo.cast" />`.

## Rules

- **The labels table is rendered from `src/data/labels.json`**, a copy of `site/labels.json` in `spangloss/spangloss`. That file is generated from `TAXONOMY.md` (`python -m spangloss.sitegen`) and its wording is approved by the owner. Never edit the wording in this repo: change it upstream, then run `node scripts/sync-labels.mjs [ref]` to copy it here (`--check` reports drift). `index.astro` only maps it to rows: basis to "Asked when", `†` for labels code can also answer, `‡` for labels some backends don't report, and indented trifecta sub-labels. The taxonomy version shown on the page comes from the same file.
- **The results page is rendered from `src/data/results.json`**, a copy of `site/results.json` in `spangloss/spangloss`, generated by `python -m spangloss.resultsgen` with a lead approved by the owner. Never edit numbers or wording in this repo: regenerate upstream, then run `node scripts/sync-results.mjs [ref]` (`--check` reports drift). `src/lib/results.ts` formats numbers as that repo's `docs/results-v0.md` does, so the two agree to the digit; the build fails if the lead or any of the explanation blocks (`how_to_read`, `findings`, `notices`, `caveats`) isn't approved. The charts in `src/components/charts/` are drawn at build time as inline SVG, with no client scripts; each mark's `<title>` carries its numbers, and the tables stay as the accessible view. Series colors are `--series-kev` and `--series-jev` in `global.css`, validated for colorblind readers against `--paper`; text never wears them.
- The same goes for the findings, which summarize `docs/findings/capture-gaps.md` in that repo, and the status list.
- Notebook prose, titles and deks are the owner's writing. Fix formatting freely; change wording only when asked.
- No tracking scripts, analytics, third-party embeds or externally hosted fonts or scripts.
- Output stays static (`output: 'static'`).
- No real organization names from private research, and no raw session data, in content or code. Describe patterns instead.
- `sec.*` is the attribute namespace; don't put the project name in attribute examples.

## Open Graph images

`scripts/build-og.mjs` renders the 1200×630 link-card PNGs into `public/og/`: `site.png`, `notebook.png` and `notebook/<entry-id>.png` per entry. It runs with plain Node before Astro (`npm run build` and `npm run dev` both call it; dev passes `--drafts`), and empties `public/og/` first so draft images never reach a production build. Keep it out of `src/pages/`: Cloudflare Pages adds the `@astrojs/cloudflare` adapter at build time, and Vite can't bundle resvg's native binary for workerd. Pages reference the images by path through `ogImage` on `Base.astro`.

## Commands

```
npm install
npm run dev       # http://localhost:4321, drafts visible
npm run build     # static site in dist/, drafts excluded
npm run preview   # serve dist/
```

Astro 7's `astro dev` runs as a background daemon: `npx astro dev stop` stops it, and `npx astro dev logs` shows its output.
