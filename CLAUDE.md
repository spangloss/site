# CLAUDE.md

## What this is

The website for spangloss, served at https://spangloss.ai. Spangloss itself (the Python sidecar that adds `sec.*` security labels to AI agent telemetry) lives in the `spangloss/spangloss` repo; this repo is only the site.

The site has two parts:

- **Landing page** (`src/pages/index.astro`): what spangloss is, how it works, the labels, the telemetry findings, how it is evaluated, the Notebook list and project status.
- **Notebook** (`src/pages/notebook/`): longer write-ups, one page per entry, plus an index and an RSS feed. Short versions run on LinkedIn and link back here.

Built with Astro as a fully static site. No server, no client-side framework, no analytics or tracking scripts, and no third-party requests: fonts come from `@fontsource` packages and the asciinema player is bundled from npm.

## Design

The visual spec is in `design/` (`A3.dc.html` for the landing page, `A3Notebook.dc.html` for a Notebook entry). Those files are canvas exports; their `{{grain}}`, `{{marker}}` and `{{accent}}` placeholders and `<x-dc>` wrapper have already been turned into plain HTML and CSS. Match them when changing layout, type or copy.

- Fonts: IM Fell English (display, italics), IBM Plex Sans (body), IBM Plex Mono (labels, nav, data).
- All site colors are CSS variables in `:root` in `src/styles/global.css`. Use the variables; don't add raw hex values in components. The one exception is `src/lib/og.ts`, which repeats a few values because satori can't read CSS variables. Keep the two in sync.
- Textures: `.linen` (page), `.leaf` (raised paper), `.crt` (terminal panels), the `#ink` and `#marker` SVG filters, and the grain overlay, all defined in `src/layouts/Base.astro` and `global.css`.

## Layout

```
src/
  content.config.ts        Notebook collection schema
  content/notebook/*.md    Notebook entries
  data/forthcoming.ts      Announced entries with no file yet
  layouts/Base.astro       <head>, OG tags, header, footer, textures
  components/              EntryList, AsciinemaPlayer, DemoSlot, Logo
  lib/notebook.ts          getEntries() (drops drafts in production), dates
  lib/og.ts                Open Graph image renderer (satori + resvg)
  pages/
    index.astro            Landing page
    og.png.ts              Landing OG image
    notebook/index.astro   Notebook index
    notebook/rss.xml.ts    RSS feed
    notebook/og.png.ts     Notebook index OG image
    notebook/[slug]/       Entry page and its og.png
public/casts/              asciinema recordings (.cast)
```

## Adding a Notebook entry

1. Create `src/content/notebook/NNN-short-slug.md`. The file name (without `.md`) becomes the URL: `/notebook/NNN-short-slug/`.
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

3. Write the body in plain Markdown. `##` headings, tables, inline code and links are styled by `.prose` in `global.css`. For the two special blocks, use the HTML already in `002-telemetry-gaps.md`: a quoted excerpt (`<figure class="leaf">` with `<blockquote>` and `<figcaption>`) and a boxed note (`<div class="aside leaf">`).
4. If the entry was listed in `src/data/forthcoming.ts`, delete it there.
5. Run `npm run dev` and check the entry page, the landing page list and `/notebook/<slug>/og.png` (the LinkedIn card image).
6. To publish, set `status: published` and a `date`, then build.

Drafts show in `npm run dev` (marked DRAFT) and never in `npm run build`: no page, no OG image, and no listing, RSS item or sitemap entry. The filter is `getEntries()` in `src/lib/notebook.ts`; always list entries through it, never with `getCollection` directly.

## Demo recording

`src/components/AsciinemaPlayer.astro` plays a file from `public/casts/`. The landing page has `<DemoSlot />`, which shows a placeholder until it is given a recording: put the file in `public/casts/` and change it to `<DemoSlot cast="demo.cast" />`.

## Rules

- **The labels table must match `TAXONOMY.md` in `spangloss/spangloss`.** The `labels` array in `src/pages/index.astro` (label names, what each asks, when it is asked) and the taxonomy version in the text beside it are a summary of that file. When the taxonomy changes, update the site in the same pass, and check it against the current `TAXONOMY.md` before changing either. The taxonomy is the owner's; never edit the table to say something `TAXONOMY.md` doesn't.
- The same goes for the findings, which summarize `docs/findings/capture-gaps.md` in that repo, and the status list.
- Notebook prose, titles and deks are the owner's writing. Fix formatting freely; change wording only when asked.
- No tracking scripts, analytics, third-party embeds or externally hosted fonts or scripts.
- Output stays static (`output: 'static'`).
- No real organization names from private research, and no raw session data, in content or code. Describe patterns instead.
- `sec.*` is the attribute namespace; don't put the project name in attribute examples.

## Commands

```
npm install
npm run dev       # http://localhost:4321, drafts visible
npm run build     # static site in dist/, drafts excluded
npm run preview   # serve dist/
```

Astro 7's `astro dev` runs as a background daemon: `npx astro dev stop` stops it, and `npx astro dev logs` shows its output.
