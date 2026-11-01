import { getCollection, type CollectionEntry } from 'astro:content';
import { forthcoming } from '../data/forthcoming';

export type Entry = CollectionEntry<'notebook'>;

/** Whether an entry gets a page and an RSS item: always in dev, only once published in production. */
function isVisible(entry: Entry): boolean {
  return !import.meta.env.PROD || entry.data.status === 'published';
}

/** Entries that get a page and an RSS item. Drafts are included only in `npm run dev`. */
export async function getEntries(): Promise<Entry[]> {
  const entries = await getCollection('notebook', isVisible);
  return entries.sort((a, b) => a.data.number - b.data.number);
}

export interface ListingRow {
  number: number;
  title: string;
  dek: string;
  /** Set when the entry has a page; unset rows render without a link. */
  href?: string;
  /** A formatted date, or FORTHCOMING. */
  date: string;
  /** Shown as DRAFT (dev only; in production a draft lists as FORTHCOMING). */
  draft: boolean;
}

/**
 * Every Notebook number in order, for the landing page and /notebook/ lists:
 * visible entries with links, then production drafts and src/data/forthcoming.ts
 * items as FORTHCOMING without links. A Markdown entry replaces a forthcoming
 * item with the same number. Each number appears once; a duplicate among the
 * Markdown files, or within forthcoming.ts, fails the build.
 */
export async function getListing(): Promise<ListingRow[]> {
  const rows = new Map<number, ListingRow>();

  for (const entry of await getCollection('notebook')) {
    const { number, title, dek, date, status } = entry.data;
    if (rows.has(number)) throw new Error(`Notebook: two entries are numbered ${number} (one is ${entry.id}).`);
    rows.set(
      number,
      isVisible(entry)
        ? { number, title, dek, href: entryPath(entry), date: formatDate(date), draft: status === 'draft' }
        : { number, title, dek, date: 'FORTHCOMING', draft: false },
    );
  }

  const announced = new Set<number>();
  for (const item of forthcoming) {
    if (announced.has(item.number)) throw new Error(`forthcoming.ts lists No. ${item.number} twice.`);
    announced.add(item.number);
    if (!rows.has(item.number)) rows.set(item.number, { ...item, date: 'FORTHCOMING', draft: false });
  }

  return [...rows.values()].sort((a, b) => a.number - b.number);
}

export function entryPath(entry: Entry): string {
  return `/notebook/${entry.id}/`;
}

/** "1 Nov 2026" in the mono small caps the design uses for dates. */
export function formatDate(date: Date | undefined): string {
  if (!date) return 'UNDATED';
  return date
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .toUpperCase();
}
