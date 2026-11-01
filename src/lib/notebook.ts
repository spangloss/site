import { getCollection, type CollectionEntry } from 'astro:content';

export type Entry = CollectionEntry<'notebook'>;

/** Drafts are visible in `npm run dev` and never in a production build. */
export async function getEntries(): Promise<Entry[]> {
  const entries = await getCollection(
    'notebook',
    (entry) => !import.meta.env.PROD || entry.data.status === 'published',
  );
  return entries.sort((a, b) => a.data.number - b.data.number);
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
