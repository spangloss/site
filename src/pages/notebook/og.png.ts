import type { APIRoute } from 'astro';
import { renderCard } from '../../lib/og';

export const GET: APIRoute = () =>
  renderCard({
    kicker: 'NOTEBOOK',
    title: 'Notebook',
    subtitle: 'Longer write-ups of what building spangloss turns up.',
  });
