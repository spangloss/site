/**
 * Announced Notebook entries that are not published yet. They are listed as
 * FORTHCOMING, without a link. A draft in src/content/notebook/_drafts/ is
 * local only, so its entry must also be listed here for production builds.
 * Delete an item here when its entry is published (an entry with the same
 * number wins anyway).
 */
export const forthcoming = [
  {
    number: 2,
    title: 'What Claude Code’s telemetry doesn’t show',
    dek: 'Five gaps in an AI coding agent’s OpenTelemetry output, and what each one hides from anyone trying to monitor it.',
  },
  {
    number: 3,
    title: 'A prompt note moves probabilities, not answers',
    dek: 'Why spangloss computes structural facts instead of asking a model for them.',
  },
  {
    number: 4,
    title: 'The summarizer that hides the attack',
    dek: 'A web fetch neutralized every planted injection, and left almost no trace of it.',
  },
  {
    number: 5,
    title: 'Gold by construction',
    dek: 'Seeded agent scenarios that label themselves, for about a cent a run.',
  },
];
