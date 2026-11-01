import type { APIRoute, GetStaticPaths } from 'astro';
import { renderCard } from '../../../lib/og';
import { getEntries, type Entry } from '../../../lib/notebook';

export const getStaticPaths = (async () => {
  const entries = await getEntries();
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: Entry }> = ({ props }) =>
  renderCard({
    kicker: `NOTEBOOK · NO. ${props.entry.data.number}`,
    title: props.entry.data.title,
    subtitle: props.entry.data.dek,
  });
