import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const notebook = defineCollection({
  // Drafts live in _drafts/, which is git-ignored, so they load locally and never
  // reach a production build. The id drops the folder, so an entry keeps its URL
  // when it moves up to publish.
  loader: glob({
    pattern: ['*.md', '_drafts/*.md'],
    base: './src/content/notebook',
    generateId: ({ entry }) => entry.replace(/^_drafts\//, '').replace(/\.md$/, ''),
  }),
  schema: z
    .object({
      number: z.number().int().positive(),
      title: z.string(),
      dek: z.string(),
      date: z.coerce.date().optional(),
      status: z.enum(['draft', 'published']),
      linkedin_url: z.url().optional(),
    })
    .refine((entry) => entry.status === 'draft' || entry.date !== undefined, {
      message: 'Published entries need a date.',
      path: ['date'],
    }),
});

export const collections = { notebook };
