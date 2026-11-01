import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { entryPath, getEntries } from '../../lib/notebook';

export const GET: APIRoute = async ({ site }) => {
  const entries = await getEntries();
  return rss({
    title: 'spangloss Notebook',
    description: 'Longer write-ups of what building spangloss turns up.',
    site: site!,
    trailingSlash: true,
    items: entries.map((entry) => ({
      title: `No. ${entry.data.number}: ${entry.data.title}`,
      description: entry.data.dek,
      // Drafts have no date; they only reach the feed in dev.
      pubDate: entry.data.date ?? new Date(),
      link: entryPath(entry),
    })),
    customData: '<language>en</language>',
  });
};
