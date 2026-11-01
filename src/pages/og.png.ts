import type { APIRoute } from 'astro';
import { renderCard } from '../lib/og';

export const GET: APIRoute = () =>
  renderCard({
    kicker: 'SECURITY LABELS FOR AI AGENT TELEMETRY',
    title: 'Your agent’s actions, glossed.',
    highlight: 'glossed.',
    subtitle: 'A short, typed gloss beside every tool call in an agent’s OpenTelemetry trace.',
  });
